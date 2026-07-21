import {
  deriveNameFromEmail,
  isAutomatedEmail,
  isValidEmail,
  normalizeEmail,
  parseAddressList,
} from "@/services/import-engine.js";
import { buildUrl, requestJson } from "./http.js";
import {
  readConfigString,
  readCursorNumber,
  readCursorString,
  type Connector,
  type ConnectorContext,
  type ExtractPage,
  type RawRecord,
} from "./types.js";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";
const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

type GmailListResponse = {
  messages?: { id: string }[];
  nextPageToken?: string;
};

type GmailMessageResponse = {
  id: string;
  internalDate?: string;
  payload?: { headers?: { name: string; value: string }[] };
};

function headerValue(message: GmailMessageResponse, name: string) {
  const headers = message.payload?.headers ?? [];
  const match = headers.find((header) => header.name.toLowerCase() === name.toLowerCase());
  return match?.value ?? "";
}

/**
 * Mines sent mail for recipients. A person the user has emailed is far stronger evidence
 * of a real relationship than membership in any directory, which is why this seeds
 * `qualified` rather than `lead`.
 *
 * Gmail has no bulk metadata endpoint, so each message in a page needs its own request.
 * Page size is kept small by default to bound that fan-out.
 */
export const gmailConnector: Connector = {
  provider: "gmail",
  entityTypes: ["person"],

  async listFields() {
    return ["name", "email", "lastContactedAt", "messageCount", "source"];
  },

  async extract(ctx: ConnectorContext): Promise<ExtractPage> {
    const pageToken = readCursorString(ctx.cursor, "pageToken");
    const query = readConfigString(ctx.config, "query") ?? "in:sent";

    const list = await requestJson<GmailListResponse>({
      url: buildUrl(`${GMAIL_BASE}/messages`, {
        q: query,
        maxResults: Math.min(ctx.pageSize, 50),
        pageToken: pageToken ?? undefined,
      }),
      accessToken: ctx.auth.accessToken,
      fetchImpl: ctx.fetchImpl,
    });

    const messages = list.messages ?? [];
    const byEmail = new Map<string, RawRecord>();

    for (const summary of messages) {
      const message = await requestJson<GmailMessageResponse>({
        url: buildUrl(`${GMAIL_BASE}/messages/${summary.id}`, {
          format: "metadata",
          metadataHeaders: "To",
        }),
        accessToken: ctx.auth.accessToken,
        fetchImpl: ctx.fetchImpl,
      });

      const sentAt = message.internalDate
        ? new Date(Number(message.internalDate)).toISOString()
        : null;

      const recipients = [
        ...parseAddressList(headerValue(message, "To")),
        ...parseAddressList(headerValue(message, "Cc")),
      ];

      for (const recipient of recipients) {
        if (isAutomatedEmail(recipient.email)) continue;

        const existing = byEmail.get(recipient.email);
        if (existing) {
          const count = Number(existing.data.messageCount ?? 1) + 1;
          existing.data.messageCount = count;
          // Keep the most recent contact date across the page.
          if (sentAt && (!existing.data.lastContactedAt || sentAt > String(existing.data.lastContactedAt))) {
            existing.data.lastContactedAt = sentAt;
          }
          continue;
        }

        byEmail.set(recipient.email, {
          externalId: recipient.email,
          data: {
            name: recipient.name ?? deriveNameFromEmail(recipient.email),
            email: recipient.email,
            lastContactedAt: sentAt,
            messageCount: 1,
            source: "gmail_sent",
          },
        });
      }
    }

    return {
      records: [...byEmail.values()],
      nextCursor: list.nextPageToken ? { pageToken: list.nextPageToken } : null,
    };
  },
};

type CalendarEventsResponse = {
  items?: {
    id: string;
    start?: { dateTime?: string; date?: string };
    summary?: string;
    attendees?: {
      email?: string;
      displayName?: string;
      self?: boolean;
      resource?: boolean;
      organizer?: boolean;
      responseStatus?: string;
    }[];
  }[];
  nextPageToken?: string;
};

/**
 * Mines calendar attendees. Someone who took a meeting is a stronger signal than someone
 * who was merely emailed, so both Google sources seed `qualified`.
 *
 * Rooms and equipment are excluded via `resource`, and the connected user via `self`.
 */
export const googleCalendarConnector: Connector = {
  provider: "google_calendar",
  entityTypes: ["person"],

  async listFields() {
    return ["name", "email", "lastContactedAt", "meetingCount", "lastMeetingTitle", "source"];
  },

  async extract(ctx: ConnectorContext): Promise<ExtractPage> {
    const pageToken = readCursorString(ctx.cursor, "pageToken");
    const calendarId = readConfigString(ctx.config, "calendarId") ?? "primary";
    const timeMin =
      readConfigString(ctx.config, "timeMin") ??
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

    const response = await requestJson<CalendarEventsResponse>({
      url: buildUrl(`${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
        timeMin,
        maxResults: Math.min(ctx.pageSize, 250),
        singleEvents: "true",
        orderBy: "startTime",
        pageToken: pageToken ?? undefined,
      }),
      accessToken: ctx.auth.accessToken,
      fetchImpl: ctx.fetchImpl,
    });

    const byEmail = new Map<string, RawRecord>();

    for (const event of response.items ?? []) {
      const startedAt = event.start?.dateTime ?? event.start?.date ?? null;

      for (const attendee of event.attendees ?? []) {
        if (!attendee.email || attendee.self || attendee.resource) continue;

        const email = normalizeEmail(attendee.email);
        if (!isValidEmail(email) || isAutomatedEmail(email)) continue;

        const existing = byEmail.get(email);
        if (existing) {
          existing.data.meetingCount = Number(existing.data.meetingCount ?? 1) + 1;
          if (startedAt && (!existing.data.lastContactedAt || startedAt > String(existing.data.lastContactedAt))) {
            existing.data.lastContactedAt = startedAt;
            existing.data.lastMeetingTitle = event.summary ?? null;
          }
          continue;
        }

        byEmail.set(email, {
          externalId: email,
          data: {
            name: attendee.displayName ?? deriveNameFromEmail(email),
            email,
            lastContactedAt: startedAt,
            meetingCount: 1,
            lastMeetingTitle: event.summary ?? null,
            source: "google_calendar",
          },
        });
      }
    }

    return {
      records: [...byEmail.values()],
      nextCursor: response.nextPageToken ? { pageToken: response.nextPageToken } : null,
    };
  },
};

type SheetsValuesResponse = {
  values?: string[][];
};

/**
 * Reads a sheet as a header row plus data rows, so it maps through exactly the same path
 * as a CSV upload. Paginates by row offset because the Sheets values endpoint has no
 * cursor of its own.
 */
export const googleSheetsConnector: Connector = {
  provider: "google_sheets",
  entityTypes: ["person", "org"],

  async listFields(ctx: ConnectorContext) {
    const headerRow = await fetchSheetRange(ctx, 1, 1);
    return (headerRow[0] ?? []).map((header) => header.trim()).filter((header) => header !== "");
  },

  async extract(ctx: ConnectorContext): Promise<ExtractPage> {
    const startRow = readCursorNumber(ctx.cursor, "startRow") ?? 2;
    const headerRow = await fetchSheetRange(ctx, 1, 1);
    const headers = (headerRow[0] ?? []).map((header) => header.trim());

    const endRow = startRow + ctx.pageSize - 1;
    const rows = await fetchSheetRange(ctx, startRow, endRow);

    const records: RawRecord[] = rows.map((cells, index) => {
      const data: Record<string, unknown> = {};
      headers.forEach((header, columnIndex) => {
        if (header === "") return;
        data[header] = (cells[columnIndex] ?? "").trim();
      });

      const rowNumber = startRow + index;
      return {
        // The sheet row is the only stable identifier available; re-running the same sheet
        // therefore updates in place rather than duplicating.
        externalId: `${readConfigString(ctx.config, "spreadsheetId") ?? "sheet"}:${rowNumber}`,
        data,
      };
    });

    const hasMore = rows.length === ctx.pageSize;
    return {
      records: records.filter((record) => Object.values(record.data).some((value) => value !== "")),
      nextCursor: hasMore ? { startRow: endRow + 1 } : null,
    };
  },
};

async function fetchSheetRange(ctx: ConnectorContext, startRow: number, endRow: number) {
  const spreadsheetId = readConfigString(ctx.config, "spreadsheetId");
  if (!spreadsheetId) {
    throw new Error("Google Sheets import requires a spreadsheetId in the source config");
  }

  const sheetName = readConfigString(ctx.config, "sheetName");
  const range = sheetName
    ? `${sheetName}!A${startRow}:ZZ${endRow}`
    : `A${startRow}:ZZ${endRow}`;

  const response = await requestJson<SheetsValuesResponse>({
    url: buildUrl(`${SHEETS_BASE}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`, {
      majorDimension: "ROWS",
    }),
    accessToken: ctx.auth.accessToken,
    fetchImpl: ctx.fetchImpl,
  });

  return response.values ?? [];
}
