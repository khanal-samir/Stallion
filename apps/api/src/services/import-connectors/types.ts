import type {
  ImportEntityType,
  ImportProvider,
} from "@workspace/validators/types/import";
import type { ImportCursor } from "@/db/schema/import.schema.js";

export type FetchLike = typeof fetch;

export type ConnectorAuth = {
  accessToken: string;
  refreshToken: string | null;
};

export type ConnectorContext = {
  auth: ConnectorAuth;
  /** Provider-scoped extraction settings: spreadsheet id, PostHog project, Outlook mode. */
  config: Record<string, unknown>;
  cursor: ImportCursor | null;
  pageSize: number;
  fetchImpl: FetchLike;
};

export type RawRecord = {
  /**
   * Stable identifier at the source. Written to `external_identities`, which is what makes
   * a re-sync update rather than duplicate. Null when a source offers nothing stable.
   */
  externalId: string | null;
  data: Record<string, unknown>;
};

export type ExtractPage = {
  records: RawRecord[];
  /** Null signals extraction is complete. */
  nextCursor: ImportCursor | null;
};

export type Connector = {
  provider: ImportProvider;
  entityTypes: ImportEntityType[];
  /** Drives the mapping UI, so mapping is discovered rather than hardcoded per provider. */
  listFields(ctx: ConnectorContext): Promise<string[]>;
  extract(ctx: ConnectorContext): Promise<ExtractPage>;
};

export function readConfigString(
  config: Record<string, unknown>,
  key: string,
): string | null {
  const value = config[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export function readCursorString(cursor: ImportCursor | null, key: string): string | null {
  if (!cursor) return null;
  const value = cursor[key];
  return typeof value === "string" && value !== "" ? value : null;
}

export function readCursorNumber(cursor: ImportCursor | null, key: string): number | null {
  if (!cursor) return null;
  const value = cursor[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
