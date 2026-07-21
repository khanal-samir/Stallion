export const IMPORT_PROVIDER_VALUES = [
  "csv",
  "webhook",
  "gmail",
  "google_calendar",
  "calendly",
  "google_sheets",
  "posthog",
  "outlook",
] as const;

export type ImportProvider = (typeof IMPORT_PROVIDER_VALUES)[number];

export const IMPORT_ENTITY_TYPE_VALUES = ["person", "org"] as const;

export type ImportEntityType = (typeof IMPORT_ENTITY_TYPE_VALUES)[number];

export const IMPORT_JOB_STATUS_VALUES = [
  "pending",
  "extracting",
  "ready_for_review",
  "loading",
  "completed",
  "failed",
  "canceled",
] as const;

export type ImportJobStatus = (typeof IMPORT_JOB_STATUS_VALUES)[number];

export const IMPORT_RECORD_STATUS_VALUES = [
  "pending",
  "valid",
  "invalid",
  "loaded",
  "skipped",
  "duplicate",
] as const;

export type ImportRecordStatus = (typeof IMPORT_RECORD_STATUS_VALUES)[number];

export const IMPORT_CONNECTION_STATUS_VALUES = [
  "connected",
  "reconnect_required",
  "disconnected",
] as const;

export type ImportConnectionStatus = (typeof IMPORT_CONNECTION_STATUS_VALUES)[number];

/**
 * Applied when an import matches an existing CRM record.
 * `fill_empty` only writes fields the CRM has left blank, which is the safe default
 * for low-trust sources.
 */
export const IMPORT_CONFLICT_POLICY_VALUES = ["source_wins", "crm_wins", "fill_empty"] as const;

export type ImportConflictPolicy = (typeof IMPORT_CONFLICT_POLICY_VALUES)[number];

export const IMPORT_MATCH_REASON_VALUES = [
  "external_identity",
  "email",
  "domain",
  "name",
  "none",
] as const;

export type ImportMatchReason = (typeof IMPORT_MATCH_REASON_VALUES)[number];

/**
 * CRM person fields an import is allowed to write. `customFields` is handled separately
 * because it targets `crm_custom_field_definitions` rather than a column.
 */
export const IMPORT_PERSON_TARGET_FIELD_VALUES = [
  "name",
  "email",
  "phone",
  "jobTitle",
  "linkedinUrl",
  "status",
  "orgName",
  "orgDomain",
  "lastContactedAt",
] as const;

export type ImportPersonTargetField = (typeof IMPORT_PERSON_TARGET_FIELD_VALUES)[number];

export const IMPORT_ORG_TARGET_FIELD_VALUES = [
  "name",
  "domain",
  "industry",
  "size",
  "location",
] as const;

export type ImportOrgTargetField = (typeof IMPORT_ORG_TARGET_FIELD_VALUES)[number];

/**
 * Providers that authenticate with a long-lived token pasted by the user rather than
 * an OAuth redirect. These never carry a refresh token.
 */
export const IMPORT_API_KEY_PROVIDERS: readonly ImportProvider[] = ["posthog", "calendly"] as const;

export const IMPORT_OAUTH_PROVIDERS: readonly ImportProvider[] = [
  "gmail",
  "google_calendar",
  "google_sheets",
  "outlook",
] as const;

/**
 * Providers with no connection at all — records arrive by upload or push.
 */
export const IMPORT_PUSH_PROVIDERS: readonly ImportProvider[] = ["csv", "webhook"] as const;

/**
 * Seeds `people.status` on create. A source that proves payment or conversation should not
 * land next to a newsletter subscriber. Never applied on update — status is CRM-owned
 * once the record exists.
 */
export const IMPORT_PROVIDER_DEFAULT_STATUS: Record<
  ImportProvider,
  "lead" | "prospect" | "qualified" | "customer" | "churned"
> = {
  gmail: "qualified",
  google_calendar: "qualified",
  calendly: "qualified",
  outlook: "qualified",
  posthog: "lead",
  csv: "lead",
  google_sheets: "lead",
  webhook: "lead",
};

export const IMPORT_MAX_RECORDS_PER_JOB = 50_000;
export const IMPORT_LOAD_BATCH_SIZE = 200;
export const IMPORT_EXTRACT_PAGE_SIZE = 100;
