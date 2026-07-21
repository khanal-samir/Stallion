import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { ImportFieldMapping } from "@workspace/validators/schemas/import";
import type { ImportConflictPolicy } from "@workspace/validators/types/import";
import { id, timestamps } from "./common.schema.js";
import { user } from "./auth.schema.js";
import { workspaces } from "./workspace.schema.js";
import { org, people } from "./crm.schema.js";
import {
  importConnectionStatusEnum,
  importEntityTypeEnum,
  importJobStatusEnum,
  importMatchReasonEnum,
  importProviderEnum,
  importRecordStatusEnum,
  peopleStatusEnum,
} from "./enums.schema.js";

export type ImportJobMapping = {
  fields: ImportFieldMapping[];
};

export type ImportJobOptionsSnapshot = {
  conflictPolicy: ImportConflictPolicy;
  defaultStatus?: (typeof peopleStatusEnum.enumValues)[number];
  defaultOwnerId: string | null;
  normalizeSubaddressing: boolean;
  createMissingOrgs: boolean;
  skipRecordsWithoutEmail: boolean;
};

export type ImportJobStats = {
  extracted: number;
  valid: number;
  invalid: number;
  created: number;
  updated: number;
  skipped: number;
  duplicate: number;
};

/**
 * Opaque per-provider pagination state. Persisted after every page so a rate-limited or
 * crashed run resumes instead of restarting.
 */
export type ImportCursor = Record<string, unknown>;

export type ImportRecordError = {
  field: string;
  message: string;
};

/**
 * Generalizes the `gmail_integrations` pattern to every provider. Left as a separate table
 * because `gmail_integrations` carries sequence-specific sending windows and rate limits
 * that do not generalize, and is load-bearing for autosend.
 */
export const integrationConnections = pgTable(
  "integration_connections",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: importProviderEnum("provider").notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    externalAccountId: varchar("external_account_id", { length: 255 }),
    status: importConnectionStatusEnum("status").notNull().default("connected"),
    grantedScopes: jsonb("granted_scopes").$type<string[]>().default([]).notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    /** Null for API-key providers such as PostHog and Calendly personal tokens. */
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at"),
    config: jsonb("config").$type<Record<string, unknown>>().default({}).notNull(),
    cursor: jsonb("cursor").$type<ImportCursor | null>(),
    lastSyncAt: timestamp("last_sync_at"),
    lastError: text("last_error"),
    ...timestamps,
  },
  (table) => [
    unique("integration_connections_workspace_provider_account_unique").on(
      table.workspaceId,
      table.provider,
      table.externalAccountId,
    ),
    index("integration_connections_workspace_id_idx").on(table.workspaceId),
    index("integration_connections_user_id_idx").on(table.userId),
    index("integration_connections_provider_idx").on(table.provider),
    index("integration_connections_status_idx").on(table.status),
  ],
);

/**
 * Authenticates inbound webhook pushes. Only the hash is stored; the plaintext key is
 * shown once at creation, matching the unsubscribe-token handling in sequences.
 */
export const integrationApiKeys = pgTable(
  "integration_api_keys",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id").references(() => user.id, { onDelete: "set null" }),
    name: varchar("name", { length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    tokenPrefix: varchar("token_prefix", { length: 16 }).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    revokedAt: timestamp("revoked_at"),
    ...timestamps,
  },
  (table) => [
    unique("integration_api_keys_token_hash_unique").on(table.tokenHash),
    index("integration_api_keys_workspace_id_idx").on(table.workspaceId),
  ],
);

export const importJobs = pgTable(
  "import_jobs",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    connectionId: uuid("connection_id").references(() => integrationConnections.id, {
      onDelete: "set null",
    }),
    createdById: uuid("created_by_id").references(() => user.id, { onDelete: "set null" }),
    provider: importProviderEnum("provider").notNull(),
    entityType: importEntityTypeEnum("entity_type").notNull().default("person"),
    status: importJobStatusEnum("status").notNull().default("pending"),
    mapping: jsonb("mapping").$type<ImportJobMapping>().default({ fields: [] }).notNull(),
    options: jsonb("options").$type<ImportJobOptionsSnapshot>().notNull(),
    sourceConfig: jsonb("source_config").$type<Record<string, unknown>>().default({}).notNull(),
    stats: jsonb("stats").$type<ImportJobStats>().notNull(),
    cursor: jsonb("cursor").$type<ImportCursor | null>(),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    lastError: text("last_error"),
    ...timestamps,
  },
  (table) => [
    index("import_jobs_workspace_id_idx").on(table.workspaceId),
    index("import_jobs_connection_id_idx").on(table.connectionId),
    index("import_jobs_status_next_attempt_idx").on(table.status, table.nextAttemptAt),
    index("import_jobs_provider_idx").on(table.provider),
  ],
);

/**
 * Staging. One row per source record, holding the untouched payload alongside the mapped
 * result. Keeping `raw` means a mapping correction re-runs the load without re-extracting.
 */
export const importRecords = pgTable(
  "import_records",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => importJobs.id, { onDelete: "cascade" }),
    externalId: varchar("external_id", { length: 255 }),
    rowNumber: integer("row_number").notNull(),
    raw: jsonb("raw").$type<Record<string, unknown>>().notNull(),
    normalized: jsonb("normalized").$type<Record<string, unknown>>(),
    status: importRecordStatusEnum("status").notNull().default("pending"),
    matchReason: importMatchReasonEnum("match_reason").notNull().default("none"),
    matchPersonId: uuid("match_person_id").references(() => people.id, { onDelete: "set null" }),
    matchOrgId: uuid("match_org_id").references(() => org.id, { onDelete: "set null" }),
    errors: jsonb("errors").$type<ImportRecordError[]>().default([]).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("import_records_job_row_unique").on(table.jobId, table.rowNumber),
    index("import_records_workspace_id_idx").on(table.workspaceId),
    index("import_records_job_status_idx").on(table.jobId, table.status),
    index("import_records_external_id_idx").on(table.externalId),
  ],
);

/**
 * The table that makes re-sync idempotent. Without it, any source yielding people without
 * email addresses duplicates on every run, because `people_workspace_email_unique` is
 * scoped to a nullable column and Postgres permits unlimited NULLs.
 */
export const externalIdentities = pgTable(
  "external_identities",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: importProviderEnum("provider").notNull(),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    entityType: importEntityTypeEnum("entity_type").notNull(),
    personId: uuid("person_id").references(() => people.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").references(() => org.id, { onDelete: "cascade" }),
    profile: jsonb("profile").$type<Record<string, unknown>>().default({}).notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [
    unique("external_identities_workspace_provider_external_unique").on(
      table.workspaceId,
      table.provider,
      table.externalId,
    ),
    index("external_identities_workspace_id_idx").on(table.workspaceId),
    index("external_identities_person_id_idx").on(table.personId),
    index("external_identities_org_id_idx").on(table.orgId),
  ],
);

export const integrationConnectionsRelations = relations(
  integrationConnections,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [integrationConnections.workspaceId],
      references: [workspaces.id],
    }),
    user: one(user, { fields: [integrationConnections.userId], references: [user.id] }),
    jobs: many(importJobs),
  }),
);

export const importJobsRelations = relations(importJobs, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [importJobs.workspaceId], references: [workspaces.id] }),
  connection: one(integrationConnections, {
    fields: [importJobs.connectionId],
    references: [integrationConnections.id],
  }),
  createdBy: one(user, { fields: [importJobs.createdById], references: [user.id] }),
  records: many(importRecords),
}));

export const importRecordsRelations = relations(importRecords, ({ one }) => ({
  workspace: one(workspaces, { fields: [importRecords.workspaceId], references: [workspaces.id] }),
  job: one(importJobs, { fields: [importRecords.jobId], references: [importJobs.id] }),
  matchPerson: one(people, { fields: [importRecords.matchPersonId], references: [people.id] }),
  matchOrg: one(org, { fields: [importRecords.matchOrgId], references: [org.id] }),
}));

export const externalIdentitiesRelations = relations(externalIdentities, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [externalIdentities.workspaceId],
    references: [workspaces.id],
  }),
  person: one(people, { fields: [externalIdentities.personId], references: [people.id] }),
  org: one(org, { fields: [externalIdentities.orgId], references: [org.id] }),
}));

export const integrationApiKeysRelations = relations(integrationApiKeys, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [integrationApiKeys.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(user, { fields: [integrationApiKeys.createdById], references: [user.id] }),
}));
