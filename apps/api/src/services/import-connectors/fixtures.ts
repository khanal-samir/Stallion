import type { ImportProvider } from "@workspace/validators/types/import";
import type { ExtractPage } from "./types.js";

/**
 * Deterministic sample pages served when INTEGRATION_LIVE_FETCH_ENABLED is false, mirroring
 * the dry-run behaviour of SEQUENCE_LIVE_SEND_ENABLED in sequence-adapters.
 *
 * This keeps the whole pipeline — extraction, mapping, matching, loading — exercisable
 * before any provider credentials exist, and gives tests a network-free path.
 *
 * Fixtures are intentionally messy: mixed casing, a free-mail address, a missing name, and
 * a duplicate across pages, so the normalization and dedupe paths are actually hit.
 */
const FIXTURES: Record<ImportProvider, ExtractPage> = {
  gmail: {
    records: [
      {
        externalId: "dana.reeves@northwind.example",
        data: {
          name: "Dana Reeves",
          email: "dana.reeves@northwind.example",
          lastContactedAt: "2026-06-02T10:15:00.000Z",
          messageCount: 4,
          source: "gmail_sent",
        },
      },
      {
        externalId: "s.patel@brightline.example",
        data: {
          name: null,
          email: "S.Patel@Brightline.example",
          lastContactedAt: "2026-05-28T08:00:00.000Z",
          messageCount: 1,
          source: "gmail_sent",
        },
      },
    ],
    nextCursor: null,
  },

  google_calendar: {
    records: [
      {
        externalId: "dana.reeves@northwind.example",
        data: {
          name: "Dana Reeves",
          email: "dana.reeves@northwind.example",
          lastContactedAt: "2026-06-10T14:00:00.000Z",
          meetingCount: 2,
          lastMeetingTitle: "Northwind / Stallion intro",
          source: "google_calendar",
        },
      },
      {
        externalId: "marcus@lumen-labs.example",
        data: {
          name: "Marcus Oyelaran",
          email: "marcus@lumen-labs.example",
          lastContactedAt: "2026-06-11T09:30:00.000Z",
          meetingCount: 1,
          lastMeetingTitle: "Pricing walkthrough",
          source: "google_calendar",
        },
      },
    ],
    nextCursor: null,
  },

  calendly: {
    records: [
      {
        externalId: "https://api.calendly.com/scheduled_events/abc/invitees/001",
        data: {
          name: "Priya Raman",
          email: "priya@vantage.example",
          lastContactedAt: "2026-06-14T16:00:00.000Z",
          eventName: "30 Minute Demo",
          timezone: "Asia/Kolkata",
          status: "active",
          "question:What are you hoping to solve?": "Replacing spreadsheets",
          "question:Company": "Vantage Systems",
        },
      },
    ],
    nextCursor: null,
  },

  google_sheets: {
    records: [
      {
        externalId: "fixture-sheet:2",
        data: {
          Name: "Alexei Petrov",
          Email: "alexei@harborworks.example",
          Company: "Harborworks",
          "Job Title": "Head of Ops",
        },
      },
      {
        externalId: "fixture-sheet:3",
        data: {
          Name: "Fen Zhao",
          Email: "fen.zhao@gmail.com",
          Company: "",
          "Job Title": "Consultant",
        },
      },
    ],
    nextCursor: null,
  },

  posthog: {
    records: [
      {
        externalId: "01917c3e-0000-7000-8000-000000000001",
        data: {
          distinctId: "user_8812",
          email: "marcus@lumen-labs.example",
          name: "Marcus Oyelaran",
          createdAt: "2026-04-02T11:00:00.000Z",
          company: "Lumen Labs",
          jobTitle: null,
          phone: null,
          "property:plan": "trial",
          "property:seats": "12",
        },
      },
      {
        externalId: "01917c3e-0000-7000-8000-000000000002",
        data: {
          distinctId: "user_9134",
          email: null,
          name: null,
          createdAt: "2026-05-19T07:45:00.000Z",
          company: null,
          jobTitle: null,
          phone: null,
          "property:plan": "free",
        },
      },
    ],
    nextCursor: null,
  },

  outlook: {
    records: [
      {
        externalId: "AAMkAGI2THVSAAA=",
        data: {
          name: "Rosa Iglesias",
          email: "rosa.iglesias@meridian.example",
          jobTitle: "VP Revenue",
          phone: "+1 (415) 555-0142",
          orgName: "Meridian Group",
          source: "outlook_contacts",
        },
      },
    ],
    nextCursor: null,
  },

  csv: { records: [], nextCursor: null },
  webhook: { records: [], nextCursor: null },
};

export function getFixturePage(provider: ImportProvider): ExtractPage {
  const page = FIXTURES[provider];

  // Structured-clone so a caller mutating record data cannot corrupt later runs.
  return {
    records: page.records.map((record) => ({
      externalId: record.externalId,
      data: { ...record.data },
    })),
    nextCursor: page.nextCursor,
  };
}

export function getFixtureFields(provider: ImportProvider): string[] {
  const fields = new Set<string>();
  for (const record of FIXTURES[provider].records) {
    for (const key of Object.keys(record.data)) fields.add(key);
  }

  return [...fields];
}
