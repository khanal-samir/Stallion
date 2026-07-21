import type { ImportProvider } from "@workspace/validators/types/import";
import { IMPORT_PUSH_PROVIDERS } from "@workspace/validators/types/import";
import { env } from "@/config/env.config.js";
import { AppError } from "@/lib/app-error.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { calendlyConnector } from "./calendly.js";
import { getFixtureFields, getFixturePage } from "./fixtures.js";
import { gmailConnector, googleCalendarConnector, googleSheetsConnector } from "./google.js";
import { outlookConnector } from "./outlook.js";
import { posthogConnector } from "./posthog.js";
import type { Connector, ConnectorContext, ExtractPage } from "./types.js";

/**
 * `csv` and `webhook` are push sources: records arrive by upload or HTTP push and are staged
 * at that moment, so there is nothing to pull. They are registered as empty connectors so
 * the rest of the pipeline can treat every provider uniformly.
 */
const pushConnector = (provider: ImportProvider): Connector => ({
  provider,
  entityTypes: ["person", "org"],
  async listFields() {
    return [];
  },
  async extract() {
    return { records: [], nextCursor: null };
  },
});

const CONNECTORS: Record<ImportProvider, Connector> = {
  gmail: gmailConnector,
  google_calendar: googleCalendarConnector,
  google_sheets: googleSheetsConnector,
  calendly: calendlyConnector,
  posthog: posthogConnector,
  outlook: outlookConnector,
  csv: pushConnector("csv"),
  webhook: pushConnector("webhook"),
};

export function getConnector(provider: ImportProvider): Connector {
  const connector = CONNECTORS[provider];
  if (!connector) {
    throw new AppError(`Unsupported import provider: ${provider}`, STATUS_CODES.BAD_REQUEST);
  }

  return connector;
}

export function isPushProvider(provider: ImportProvider) {
  return IMPORT_PUSH_PROVIDERS.includes(provider);
}

/**
 * Single place the live/fixture switch is applied, so no connector has to know about it.
 * With INTEGRATION_LIVE_FETCH_ENABLED off, the pipeline runs end to end against fixtures.
 */
export async function extractPage(
  provider: ImportProvider,
  ctx: ConnectorContext,
): Promise<ExtractPage> {
  if (!env.INTEGRATION_LIVE_FETCH_ENABLED) {
    // Fixtures are a single page; a stored cursor means that page was already consumed.
    return ctx.cursor ? { records: [], nextCursor: null } : getFixturePage(provider);
  }

  return getConnector(provider).extract(ctx);
}

export async function listSourceFields(
  provider: ImportProvider,
  ctx: ConnectorContext,
): Promise<string[]> {
  if (!env.INTEGRATION_LIVE_FETCH_ENABLED) {
    return getFixtureFields(provider);
  }

  return getConnector(provider).listFields(ctx);
}

export { ConnectionAuthError, RateLimitError } from "./http.js";
export type { Connector, ConnectorContext, ExtractPage, RawRecord } from "./types.js";
