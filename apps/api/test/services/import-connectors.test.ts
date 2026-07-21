import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/env.config.js", () => ({
  env: {
    INTEGRATION_LIVE_FETCH_ENABLED: false,
    POSTHOG_API_HOST: "https://us.posthog.com",
    CALENDLY_API_HOST: "https://api.calendly.com",
  },
}));

import { AppError } from "@/lib/app-error.js";
import { calendlyConnector } from "@/services/import-connectors/calendly.js";
import { getFixtureFields, getFixturePage } from "@/services/import-connectors/fixtures.js";
import {
  gmailConnector,
  googleCalendarConnector,
  googleSheetsConnector,
} from "@/services/import-connectors/google.js";
import {
  ConnectionAuthError,
  parseRetryAfter,
  RateLimitError,
  requestJson,
} from "@/services/import-connectors/http.js";
import { outlookConnector } from "@/services/import-connectors/outlook.js";
import { posthogConnector } from "@/services/import-connectors/posthog.js";
import type { ConnectorContext } from "@/services/import-connectors/types.js";

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });

function contextWith(
  responses: unknown[],
  config: Record<string, unknown> = {},
  cursor: Record<string, unknown> | null = null,
): ConnectorContext & { calls: string[] } {
  const calls: string[] = [];
  let index = 0;

  return {
    auth: { accessToken: "token", refreshToken: null },
    config,
    cursor,
    pageSize: 10,
    calls,
    fetchImpl: (async (url: string | URL) => {
      calls.push(String(url));
      const body = responses[Math.min(index, responses.length - 1)];
      index += 1;
      return body instanceof Response ? body : jsonResponse(body);
    }) as unknown as ConnectorContext["fetchImpl"],
  };
}

describe("connector http handling", () => {
  it("converts a 429 into a reschedule instruction rather than a failure", async () => {
    const ctx = contextWith([
      new Response("{}", { status: 429, headers: { "retry-after": "120" } }),
    ]);

    await expect(
      requestJson({ url: "https://example.test/x", accessToken: "t", fetchImpl: ctx.fetchImpl }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("treats 401 and 403 as credential failures that retrying cannot fix", async () => {
    for (const status of [401, 403]) {
      const ctx = contextWith([new Response("{}", { status })]);
      await expect(
        requestJson({ url: "https://example.test/x", accessToken: "t", fetchImpl: ctx.fetchImpl }),
      ).rejects.toBeInstanceOf(ConnectionAuthError);
    }
  });

  it("surfaces other failures as an operational error", async () => {
    const ctx = contextWith([new Response("{}", { status: 500 })]);

    await expect(
      requestJson({ url: "https://example.test/x", accessToken: "t", fetchImpl: ctx.fetchImpl }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("parses Retry-After as seconds or as an HTTP date", () => {
    const now = new Date("2026-07-20T12:00:00.000Z");

    expect(parseRetryAfter("30", now)).toBe(30_000);
    expect(parseRetryAfter("Mon, 20 Jul 2026 12:02:00 GMT", now)).toBe(120_000);
    expect(parseRetryAfter(null, now)).toBe(60_000);
    expect(parseRetryAfter("gibberish", now)).toBe(60_000);
    // A date in the past must not produce a negative delay.
    expect(parseRetryAfter("Mon, 20 Jul 2026 11:00:00 GMT", now)).toBe(0);
  });
});

describe("gmail connector", () => {
  it("aggregates recipients across messages and counts repeats", async () => {
    const ctx = contextWith([
      { messages: [{ id: "m1" }, { id: "m2" }], nextPageToken: "next" },
      {
        id: "m1",
        internalDate: "1780000000000",
        payload: { headers: [{ name: "To", value: "Dana <dana@northwind.example>" }] },
      },
      {
        id: "m2",
        internalDate: "1790000000000",
        payload: { headers: [{ name: "To", value: "dana@northwind.example" }] },
      },
    ]);

    const page = await gmailConnector.extract(ctx);

    expect(page.records).toHaveLength(1);
    expect(page.records[0]!.data.messageCount).toBe(2);
    expect(page.records[0]!.externalId).toBe("dana@northwind.example");
    // The most recent send wins as the contact date.
    expect(page.records[0]!.data.lastContactedAt).toBe(new Date(1790000000000).toISOString());
    expect(page.nextCursor).toEqual({ pageToken: "next" });
  });

  it("drops automated senders", async () => {
    const ctx = contextWith([
      { messages: [{ id: "m1" }] },
      { id: "m1", payload: { headers: [{ name: "To", value: "noreply@stripe.com" }] } },
    ]);

    expect((await gmailConnector.extract(ctx)).records).toEqual([]);
  });

  it("returns an empty page and no cursor when the mailbox has nothing left", async () => {
    const page = await gmailConnector.extract(contextWith([{}]));

    expect(page.records).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });
});

describe("google calendar connector", () => {
  it("excludes the connected user and room resources", async () => {
    const ctx = contextWith([
      {
        items: [
          {
            id: "e1",
            summary: "Intro",
            start: { dateTime: "2026-06-10T14:00:00.000Z" },
            attendees: [
              { email: "me@own.example", self: true },
              { email: "room-a@resource.calendar.google.com", resource: true },
              { email: "Dana@Northwind.example", displayName: "Dana Reeves" },
            ],
          },
        ],
      },
    ]);

    const page = await googleCalendarConnector.extract(ctx);

    expect(page.records).toHaveLength(1);
    expect(page.records[0]!.data.email).toBe("dana@northwind.example");
    expect(page.records[0]!.data.lastMeetingTitle).toBe("Intro");
  });

  it("counts repeat attendees and keeps the latest meeting", async () => {
    const ctx = contextWith([
      {
        items: [
          {
            id: "e1",
            summary: "First",
            start: { dateTime: "2026-06-01T10:00:00.000Z" },
            attendees: [{ email: "dana@northwind.example" }],
          },
          {
            id: "e2",
            summary: "Second",
            start: { dateTime: "2026-06-09T10:00:00.000Z" },
            attendees: [{ email: "dana@northwind.example" }],
          },
        ],
        nextPageToken: "p2",
      },
    ]);

    const page = await googleCalendarConnector.extract(ctx);

    expect(page.records[0]!.data.meetingCount).toBe(2);
    expect(page.records[0]!.data.lastMeetingTitle).toBe("Second");
    expect(page.nextCursor).toEqual({ pageToken: "p2" });
  });
});

describe("google sheets connector", () => {
  it("maps a header row onto data rows and paginates by row offset", async () => {
    const ctx = contextWith(
      [
        { values: [["Name", "Email"]] },
        {
          values: Array.from({ length: 10 }, (_, index) => [
            `Person ${index}`,
            `p${index}@x.example`,
          ]),
        },
      ],
      { spreadsheetId: "sheet-1" },
    );

    const page = await googleSheetsConnector.extract(ctx);

    expect(page.records).toHaveLength(10);
    expect(page.records[0]!.data).toEqual({ Name: "Person 0", Email: "p0@x.example" });
    expect(page.records[0]!.externalId).toBe("sheet-1:2");
    // A full page implies there may be more rows.
    expect(page.nextCursor).toEqual({ startRow: 12 });
  });

  it("stops paginating on a short page and skips fully blank rows", async () => {
    const ctx = contextWith(
      [{ values: [["Name", "Email"]] }, { values: [["Dana", "dana@x.example"], ["", ""]] }],
      { spreadsheetId: "sheet-1" },
    );

    const page = await googleSheetsConnector.extract(ctx);

    expect(page.records).toHaveLength(1);
    expect(page.nextCursor).toBeNull();
  });

  it("requires a spreadsheet id", async () => {
    await expect(googleSheetsConnector.extract(contextWith([{}]))).rejects.toThrow(
      /spreadsheetId/,
    );
  });

  it("lists header fields for the mapping UI", async () => {
    const ctx = contextWith([{ values: [["Name", " Email ", ""]] }], { spreadsheetId: "s" });

    expect(await googleSheetsConnector.listFields(ctx)).toEqual(["Name", "Email"]);
  });
});

describe("calendly connector", () => {
  it("flattens booking questions onto the record", async () => {
    const ctx = contextWith(
      [
        {
          collection: [
            { uri: "https://api.calendly.com/scheduled_events/abc", name: "Demo", start_time: "2026-06-14T16:00:00.000Z" },
          ],
          pagination: { next_page_token: null },
        },
        {
          collection: [
            {
              uri: "https://api.calendly.com/scheduled_events/abc/invitees/001",
              email: "Priya@Vantage.example",
              name: "Priya Raman",
              questions_and_answers: [
                { question: "Company", answer: "Vantage Systems" },
                { question: "Budget", answer: "   " },
              ],
            },
          ],
        },
      ],
      { organization: "https://api.calendly.com/organizations/org-1" },
    );

    const page = await calendlyConnector.extract(ctx);

    expect(page.records).toHaveLength(1);
    expect(page.records[0]!.data.email).toBe("priya@vantage.example");
    expect(page.records[0]!.data["question:Company"]).toBe("Vantage Systems");
    // A blank answer is not a field.
    expect(page.records[0]!.data["question:Budget"]).toBeUndefined();
    expect(page.nextCursor).toBeNull();
  });

  it("requires an organization uri", async () => {
    await expect(calendlyConnector.extract(contextWith([{}]))).rejects.toThrow(/organization/);
  });
});

describe("posthog connector", () => {
  it("reads identity from properties and surfaces custom properties", async () => {
    const ctx = contextWith(
      [
        {
          results: [
            {
              id: 42,
              distinct_ids: ["user_8812"],
              properties: {
                email: "Marcus@Lumen-Labs.example",
                first_name: "Marcus",
                last_name: "Oyelaran",
                company: "Lumen Labs",
                plan: "trial",
                $device_type: "Desktop",
              },
            },
          ],
          next: "https://us.posthog.com/api/projects/1/persons/?cursor=abc",
        },
      ],
      { projectId: "1" },
    );

    const page = await posthogConnector.extract(ctx);
    const record = page.records[0]!;

    expect(record.externalId).toBe("42");
    expect(record.data.email).toBe("marcus@lumen-labs.example");
    expect(record.data.name).toBe("Marcus Oyelaran");
    expect(record.data.company).toBe("Lumen Labs");
    expect(record.data["property:plan"]).toBe("trial");
    // PostHog internal properties are noise, not CRM fields.
    expect(record.data["property:$device_type"]).toBeUndefined();
    expect(page.nextCursor).toEqual({
      next: "https://us.posthog.com/api/projects/1/persons/?cursor=abc",
    });
  });

  it("follows a stored cursor url verbatim", async () => {
    const ctx = contextWith([{ results: [] }], { projectId: "1" }, {
      next: "https://us.posthog.com/api/projects/1/persons/?cursor=abc",
    });

    await posthogConnector.extract(ctx);

    expect(ctx.calls[0]).toBe("https://us.posthog.com/api/projects/1/persons/?cursor=abc");
  });

  it("requires a project id", async () => {
    await expect(posthogConnector.extract(contextWith([{}]))).rejects.toThrow(/projectId/);
  });
});

describe("outlook connector", () => {
  it("reads contacts by default", async () => {
    const ctx = contextWith([
      {
        value: [
          {
            id: "c1",
            displayName: "Rosa Iglesias",
            jobTitle: "VP Revenue",
            companyName: "Meridian Group",
            businessPhones: ["+1 415 555 0142"],
            emailAddresses: [{ address: "Rosa@Meridian.example" }],
          },
        ],
        "@odata.nextLink": "https://graph.microsoft.com/next",
      },
    ]);

    const page = await outlookConnector.extract(ctx);

    expect(page.records[0]!.data.email).toBe("rosa@meridian.example");
    expect(page.records[0]!.data.orgName).toBe("Meridian Group");
    expect(page.nextCursor).toEqual({ nextLink: "https://graph.microsoft.com/next" });
  });

  it("aggregates sent-mail recipients when mode is sent_mail", async () => {
    const ctx = contextWith(
      [
        {
          value: [
            {
              id: "m1",
              sentDateTime: "2026-06-01T10:00:00.000Z",
              toRecipients: [{ emailAddress: { address: "dana@northwind.example", name: "Dana" } }],
              ccRecipients: [{ emailAddress: { address: "noreply@x.example" } }],
            },
            {
              id: "m2",
              sentDateTime: "2026-06-05T10:00:00.000Z",
              toRecipients: [{ emailAddress: { address: "dana@northwind.example" } }],
            },
          ],
        },
      ],
      { mode: "sent_mail" },
    );

    const page = await outlookConnector.extract(ctx);

    expect(page.records).toHaveLength(1);
    expect(page.records[0]!.data.messageCount).toBe(2);
    expect(page.records[0]!.data.lastContactedAt).toBe("2026-06-05T10:00:00.000Z");
  });

  it("excludes resource attendees when mode is calendar", async () => {
    const ctx = contextWith(
      [
        {
          value: [
            {
              id: "e1",
              subject: "Review",
              start: { dateTime: "2026-06-10T14:00:00.000Z" },
              attendees: [
                { emailAddress: { address: "room@meridian.example" }, type: "resource" },
                { emailAddress: { address: "rosa@meridian.example" }, type: "required" },
              ],
            },
          ],
        },
      ],
      { mode: "calendar" },
    );

    const page = await outlookConnector.extract(ctx);

    expect(page.records).toHaveLength(1);
    expect(page.records[0]!.data.email).toBe("rosa@meridian.example");
  });

  it("falls back to contacts for an unknown mode and lists mode-specific fields", async () => {
    const contactsCtx = contextWith([{ value: [] }], { mode: "nonsense" });
    expect((await outlookConnector.extract(contactsCtx)).records).toEqual([]);

    expect(await outlookConnector.listFields(contextWith([], { mode: "calendar" }))).toContain(
      "meetingCount",
    );
    expect(await outlookConnector.listFields(contextWith([], { mode: "sent_mail" }))).toContain(
      "messageCount",
    );
    expect(await outlookConnector.listFields(contextWith([], {}))).toContain("orgName");
  });
});

describe("fixtures", () => {
  it("serves a deterministic page per provider without touching the network", () => {
    expect(getFixturePage("gmail").records).toHaveLength(2);
    expect(getFixturePage("csv").records).toEqual([]);
    expect(getFixtureFields("posthog")).toContain("distinctId");
  });

  it("clones records so a caller cannot corrupt later runs", () => {
    const first = getFixturePage("gmail");
    first.records[0]!.data.name = "mutated";

    expect(getFixturePage("gmail").records[0]!.data.name).toBe("Dana Reeves");
  });
});
