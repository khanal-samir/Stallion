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

type CalendlyEventsResponse = {
  collection?: {
    uri: string;
    name?: string;
    start_time?: string;
    status?: string;
  }[];
  pagination?: { next_page_token?: string | null };
};

type CalendlyInviteesResponse = {
  collection?: {
    uri: string;
    email?: string;
    name?: string;
    status?: string;
    timezone?: string;
    created_at?: string;
    questions_and_answers?: { question: string; answer: string }[];
  }[];
};

function eventUuid(uri: string) {
  return uri.split("/").pop() ?? uri;
}

/**
 * Someone who booked a meeting is qualified by definition, which makes Calendly one of the
 * best value-to-effort sources available.
 *
 * Booking forms usually capture company and other custom questions, so answers are flattened
 * onto the record as `question:<text>` keys and become mappable to custom fields.
 */
export const calendlyConnector: Connector = {
  provider: "calendly",
  entityTypes: ["person"],

  async listFields(ctx: ConnectorContext) {
    const base = ["name", "email", "lastContactedAt", "eventName", "timezone", "status"];
    const page = await this.extract({ ...ctx, pageSize: 5, cursor: null });
    const questionKeys = new Set<string>();

    for (const record of page.records) {
      for (const key of Object.keys(record.data)) {
        if (key.startsWith("question:")) questionKeys.add(key);
      }
    }

    return [...base, ...questionKeys];
  },

  async extract(ctx: ConnectorContext): Promise<ExtractPage> {
    const organization = readConfigString(ctx.config, "organization");
    if (!organization) {
      throw new Error("Calendly import requires an organization URI in the source config");
    }

    const pageToken = readCursorString(ctx.cursor, "pageToken");
    const minStartTime =
      readConfigString(ctx.config, "minStartTime") ??
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

    const events = await requestJson<CalendlyEventsResponse>({
      url: buildUrl(`${env.CALENDLY_API_HOST}/scheduled_events`, {
        organization,
        count: Math.min(ctx.pageSize, 100),
        min_start_time: minStartTime,
        sort: "start_time:asc",
        page_token: pageToken ?? undefined,
      }),
      accessToken: ctx.auth.accessToken,
      fetchImpl: ctx.fetchImpl,
    });

    const records: RawRecord[] = [];

    for (const event of events.collection ?? []) {
      const invitees = await requestJson<CalendlyInviteesResponse>({
        url: buildUrl(`${env.CALENDLY_API_HOST}/scheduled_events/${eventUuid(event.uri)}/invitees`, {
          count: 100,
        }),
        accessToken: ctx.auth.accessToken,
        fetchImpl: ctx.fetchImpl,
      });

      for (const invitee of invitees.collection ?? []) {
        if (!invitee.email) continue;

        const email = normalizeEmail(invitee.email);
        if (!isValidEmail(email)) continue;

        const data: Record<string, unknown> = {
          name: invitee.name ?? deriveNameFromEmail(email),
          email,
          lastContactedAt: event.start_time ?? invitee.created_at ?? null,
          eventName: event.name ?? null,
          timezone: invitee.timezone ?? null,
          status: invitee.status ?? event.status ?? null,
        };

        for (const answer of invitee.questions_and_answers ?? []) {
          if (answer.answer.trim() === "") continue;
          data[`question:${answer.question}`] = answer.answer;
        }

        records.push({ externalId: invitee.uri, data });
      }
    }

    const nextPageToken = events.pagination?.next_page_token;
    return {
      records,
      nextCursor: nextPageToken ? { pageToken: nextPageToken } : null,
    };
  },
};
