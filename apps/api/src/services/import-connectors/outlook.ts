import {
  deriveNameFromEmail,
  isAutomatedEmail,
  isValidEmail,
  normalizeEmail,
} from "@/services/import-engine.js";
import { buildUrl, requestJson } from "./http.js";
import {
  readConfigString,
  readCursorString,
  type Connector,
  type ConnectorContext,
  type ExtractPage,
  type RawRecord,
} from "./types.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0/me";

export const OUTLOOK_MODES = ["contacts", "sent_mail", "calendar"] as const;
export type OutlookMode = (typeof OUTLOOK_MODES)[number];

type GraphRecipient = {
  emailAddress?: { address?: string; name?: string };
};

type GraphContactsResponse = {
  value?: {
    id: string;
    displayName?: string;
    jobTitle?: string;
    companyName?: string;
    mobilePhone?: string;
    businessPhones?: string[];
    emailAddresses?: { address?: string; name?: string }[];
  }[];
  "@odata.nextLink"?: string;
};

type GraphMessagesResponse = {
  value?: {
    id: string;
    sentDateTime?: string;
    toRecipients?: GraphRecipient[];
    ccRecipients?: GraphRecipient[];
  }[];
  "@odata.nextLink"?: string;
};

type GraphEventsResponse = {
  value?: {
    id: string;
    subject?: string;
    start?: { dateTime?: string };
    attendees?: {
      emailAddress?: { address?: string; name?: string };
      type?: string;
    }[];
  }[];
  "@odata.nextLink"?: string;
};

function readMode(ctx: ConnectorContext): OutlookMode {
  const configured = readConfigString(ctx.config, "mode");
  return (OUTLOOK_MODES as readonly string[]).includes(configured ?? "")
    ? (configured as OutlookMode)
    : "contacts";
}

/**
 * Microsoft Graph is unusually efficient to integrate: contacts, sent mail, and calendar
 * arrive through one OAuth grant and one API surface, so a single connector covers what
 * takes two on the Google side.
 *
 * Which of the three a job pulls is chosen by `mode` in the source config.
 */
export const outlookConnector: Connector = {
  provider: "outlook",
  entityTypes: ["person"],

  async listFields(ctx: ConnectorContext) {
    const mode = readMode(ctx);
    if (mode === "contacts") {
      return ["name", "email", "jobTitle", "phone", "orgName", "source"];
    }
    if (mode === "calendar") {
      return ["name", "email", "lastContactedAt", "meetingCount", "lastMeetingTitle", "source"];
    }

    return ["name", "email", "lastContactedAt", "messageCount", "source"];
  },

  async extract(ctx: ConnectorContext): Promise<ExtractPage> {
    const mode = readMode(ctx);
    if (mode === "contacts") return extractContacts(ctx);
    if (mode === "calendar") return extractCalendar(ctx);

    return extractSentMail(ctx);
  },
};

async function extractContacts(ctx: ConnectorContext): Promise<ExtractPage> {
  const nextLink = readCursorString(ctx.cursor, "nextLink");
  const response = await requestJson<GraphContactsResponse>({
    url: nextLink ?? buildUrl(`${GRAPH_BASE}/contacts`, { $top: Math.min(ctx.pageSize, 100) }),
    accessToken: ctx.auth.accessToken,
    fetchImpl: ctx.fetchImpl,
  });

  const records: RawRecord[] = [];

  for (const contact of response.value ?? []) {
    const rawEmail = contact.emailAddresses?.[0]?.address;
    const email = rawEmail && isValidEmail(rawEmail) ? normalizeEmail(rawEmail) : null;
    if (!email && !contact.displayName) continue;

    records.push({
      externalId: contact.id,
      data: {
        name: contact.displayName ?? (email ? deriveNameFromEmail(email) : null),
        email,
        jobTitle: contact.jobTitle ?? null,
        phone: contact.mobilePhone ?? contact.businessPhones?.[0] ?? null,
        orgName: contact.companyName ?? null,
        source: "outlook_contacts",
      },
    });
  }

  return {
    records,
    nextCursor: response["@odata.nextLink"] ? { nextLink: response["@odata.nextLink"] } : null,
  };
}

async function extractSentMail(ctx: ConnectorContext): Promise<ExtractPage> {
  const nextLink = readCursorString(ctx.cursor, "nextLink");
  const response = await requestJson<GraphMessagesResponse>({
    url:
      nextLink ??
      buildUrl(`${GRAPH_BASE}/mailFolders/sentitems/messages`, {
        $top: Math.min(ctx.pageSize, 100),
        $select: "toRecipients,ccRecipients,sentDateTime",
        $orderby: "sentDateTime desc",
      }),
    accessToken: ctx.auth.accessToken,
    fetchImpl: ctx.fetchImpl,
  });

  const byEmail = new Map<string, RawRecord>();

  for (const message of response.value ?? []) {
    const recipients = [...(message.toRecipients ?? []), ...(message.ccRecipients ?? [])];

    for (const recipient of recipients) {
      const address = recipient.emailAddress?.address;
      if (!address) continue;

      const email = normalizeEmail(address);
      if (!isValidEmail(email) || isAutomatedEmail(email)) continue;

      const sentAt = message.sentDateTime ?? null;
      const existing = byEmail.get(email);
      if (existing) {
        existing.data.messageCount = Number(existing.data.messageCount ?? 1) + 1;
        if (sentAt && (!existing.data.lastContactedAt || sentAt > String(existing.data.lastContactedAt))) {
          existing.data.lastContactedAt = sentAt;
        }
        continue;
      }

      byEmail.set(email, {
        externalId: email,
        data: {
          name: recipient.emailAddress?.name ?? deriveNameFromEmail(email),
          email,
          lastContactedAt: sentAt,
          messageCount: 1,
          source: "outlook_sent",
        },
      });
    }
  }

  return {
    records: [...byEmail.values()],
    nextCursor: response["@odata.nextLink"] ? { nextLink: response["@odata.nextLink"] } : null,
  };
}

async function extractCalendar(ctx: ConnectorContext): Promise<ExtractPage> {
  const nextLink = readCursorString(ctx.cursor, "nextLink");
  const response = await requestJson<GraphEventsResponse>({
    url:
      nextLink ??
      buildUrl(`${GRAPH_BASE}/events`, {
        $top: Math.min(ctx.pageSize, 100),
        $select: "subject,start,attendees",
        $orderby: "start/dateTime desc",
      }),
    accessToken: ctx.auth.accessToken,
    fetchImpl: ctx.fetchImpl,
  });

  const byEmail = new Map<string, RawRecord>();

  for (const event of response.value ?? []) {
    const startedAt = event.start?.dateTime ?? null;

    for (const attendee of event.attendees ?? []) {
      // Rooms and equipment come through as `resource` attendees and are not people.
      if (attendee.type === "resource") continue;

      const address = attendee.emailAddress?.address;
      if (!address) continue;

      const email = normalizeEmail(address);
      if (!isValidEmail(email) || isAutomatedEmail(email)) continue;

      const existing = byEmail.get(email);
      if (existing) {
        existing.data.meetingCount = Number(existing.data.meetingCount ?? 1) + 1;
        if (startedAt && (!existing.data.lastContactedAt || startedAt > String(existing.data.lastContactedAt))) {
          existing.data.lastContactedAt = startedAt;
          existing.data.lastMeetingTitle = event.subject ?? null;
        }
        continue;
      }

      byEmail.set(email, {
        externalId: email,
        data: {
          name: attendee.emailAddress?.name ?? deriveNameFromEmail(email),
          email,
          lastContactedAt: startedAt,
          meetingCount: 1,
          lastMeetingTitle: event.subject ?? null,
          source: "outlook_calendar",
        },
      });
    }
  }

  return {
    records: [...byEmail.values()],
    nextCursor: response["@odata.nextLink"] ? { nextLink: response["@odata.nextLink"] } : null,
  };
}
