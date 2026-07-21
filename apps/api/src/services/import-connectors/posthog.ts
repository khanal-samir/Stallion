import { env } from "@/config/env.config.js";
import { deriveNameFromEmail, isValidEmail, normalizeEmail } from "@/services/import-engine.js";
import { buildUrl, requestJson } from "./http.js";
import {
  readConfigString,
  readCursorString,
  type Connector,
  type ConnectorContext,
  type ExtractPage,
  type RawRecord,
} from "./types.js";

type PostHogPersonsResponse = {
  results?: {
    id: string | number;
    distinct_ids?: string[];
    name?: string;
    created_at?: string;
    properties?: Record<string, unknown>;
  }[];
  next?: string | null;
};

/**
 * PostHog property keys that carry CRM meaning. Everything else is surfaced as a mappable
 * field so a workspace's own property naming can be routed to custom fields.
 */
const KNOWN_PROPERTY_FIELDS = [
  "email",
  "name",
  "$name",
  "first_name",
  "last_name",
  "company",
  "company_name",
  "organization",
  "$initial_referring_domain",
  "job_title",
  "title",
  "phone",
];

function readProperty(properties: Record<string, unknown>, key: string): string | null {
  const value = properties[key];
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function apiHost(ctx: ConnectorContext) {
  return readConfigString(ctx.config, "apiHost") ?? env.POSTHOG_API_HOST;
}

/**
 * Answers "who is using the product but has not been contacted", which is what makes the
 * CRM product-led rather than a rolodex.
 *
 * Authenticates with a personal API key rather than OAuth, so the connection carries no
 * refresh token.
 */
export const posthogConnector: Connector = {
  provider: "posthog",
  entityTypes: ["person"],

  async listFields(ctx: ConnectorContext) {
    const page = await this.extract({ ...ctx, pageSize: 20, cursor: null });
    const fields = new Set<string>(["distinctId", "email", "name", "createdAt"]);

    for (const record of page.records) {
      for (const key of Object.keys(record.data)) fields.add(key);
    }

    return [...fields];
  },

  async extract(ctx: ConnectorContext): Promise<ExtractPage> {
    const projectId = readConfigString(ctx.config, "projectId");
    if (!projectId) {
      throw new Error("PostHog import requires a projectId in the source config");
    }

    // PostHog returns a fully-qualified `next` URL, so a stored cursor is used verbatim.
    const nextUrl = readCursorString(ctx.cursor, "next");
    const url =
      nextUrl ??
      buildUrl(`${apiHost(ctx)}/api/projects/${encodeURIComponent(projectId)}/persons/`, {
        limit: Math.min(ctx.pageSize, 100),
      });

    const response = await requestJson<PostHogPersonsResponse>({
      url,
      accessToken: ctx.auth.accessToken,
      fetchImpl: ctx.fetchImpl,
    });

    const records: RawRecord[] = [];

    for (const person of response.results ?? []) {
      const properties = person.properties ?? {};
      const rawEmail = readProperty(properties, "email");
      const email = rawEmail && isValidEmail(rawEmail) ? normalizeEmail(rawEmail) : null;

      const firstName = readProperty(properties, "first_name");
      const lastName = readProperty(properties, "last_name");
      const composedName =
        readProperty(properties, "name") ??
        readProperty(properties, "$name") ??
        person.name ??
        (firstName || lastName ? [firstName, lastName].filter(Boolean).join(" ") : null);

      const data: Record<string, unknown> = {
        distinctId: person.distinct_ids?.[0] ?? null,
        email,
        name: composedName ?? (email ? deriveNameFromEmail(email) : null),
        createdAt: person.created_at ?? null,
        company:
          readProperty(properties, "company") ??
          readProperty(properties, "company_name") ??
          readProperty(properties, "organization"),
        jobTitle: readProperty(properties, "job_title") ?? readProperty(properties, "title"),
        phone: readProperty(properties, "phone"),
      };

      // Surface remaining custom properties so a workspace can map its own naming.
      for (const [key, value] of Object.entries(properties)) {
        if (KNOWN_PROPERTY_FIELDS.includes(key)) continue;
        if (key.startsWith("$")) continue;

        const readable = readProperty(properties, key);
        if (readable !== null) data[`property:${key}`] = readable;
        else if (value === null) data[`property:${key}`] = null;
      }

      records.push({ externalId: String(person.id), data });
    }

    return {
      records,
      nextCursor: response.next ? { next: response.next } : null,
    };
  },
};
