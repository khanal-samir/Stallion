import { and, asc, count, eq, inArray, isNotNull, lte, or, sql } from "drizzle-orm";
import type {
  CreateConnectionInput,
  ImportFieldMapping,
  ListImportJobsQuery,
  ListImportRecordsQuery,
  StartImportJobInput,
  UpdateConnectionInput,
  UpdateImportJobInput,
  WebhookIngestInput,
} from "@workspace/validators/schemas/import";
import type { ImportEntityType, ImportProvider } from "@workspace/validators/types/import";
import {
  IMPORT_EXTRACT_PAGE_SIZE,
  IMPORT_LOAD_BATCH_SIZE,
  IMPORT_MAX_RECORDS_PER_JOB,
  IMPORT_PROVIDER_DEFAULT_STATUS,
} from "@workspace/validators/types/import";
import { env } from "@/config/env.config.js";
import { db } from "@/db/client.js";
import {
  externalIdentities,
  importJobs,
  importRecords,
  integrationApiKeys,
  integrationConnections,
  org,
  people,
  type ImportCursor,
  type ImportJobOptionsSnapshot,
  type ImportJobStats,
  type ImportRecordError,
} from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { AppError } from "@/lib/app-error.js";
import {
  createPublicToken,
  decryptSecretToken,
  encryptSecretToken,
  hashPublicToken,
} from "@/lib/token-crypto.js";
import { parseCsv } from "@/services/import-csv.js";
import {
  deriveRecordFingerprint,
  fieldPolicy,
  normalizeDomain,
  resolveFieldValue,
  resolveOrgMatch,
  resolvePersonMatch,
  shouldSkipExistingRecord,
} from "@/services/import-engine.js";
import {
  applyOrgMapping,
  applyPersonMapping,
  autoDetectMapping,
  validateMappedOrg,
  validateMappedPerson,
  type MappedOrg,
  type MappedPerson,
} from "@/services/import-mapping.js";
import {
  ConnectionAuthError,
  extractPage,
  isPushProvider,
  listSourceFields,
  RateLimitError,
} from "@/services/import-connectors/index.js";

const EMPTY_STATS: ImportJobStats = {
  extracted: 0,
  valid: 0,
  invalid: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  duplicate: 0,
};

const MAX_JOB_ATTEMPTS = 5;

function tokenSecret() {
  return env.INTEGRATION_TOKEN_SECRET ?? env.BETTER_AUTH_SECRET;
}

function assertFound<T>(value: T | undefined, message: string): T {
  if (!value) throw new AppError(message, STATUS_CODES.NOT_FOUND);
  return value;
}

/**
 * The identifier a record matches on across runs. A real source id (Gmail address, PostHog
 * id, webhook-supplied externalId) is authoritative and preserved. When the source offers
 * nothing — a CSV row, an anonymous push — a content fingerprint stands in, so re-uploading
 * the same file updates rather than duplicates.
 *
 * Synthetic ids carry an `fp_` prefix so they can be told apart from real ones and
 * recomputed from scratch on every pass; that keeps them correct after a remap changes the
 * identifying fields, instead of pinning to a stale value persisted on the first pass.
 */
function effectiveExternalId(
  rawExternalId: string | null,
  mapped: Pick<MappedPerson, "name" | "email" | "phone" | "orgName"> | null,
): string | null {
  const sourceId = rawExternalId && !rawExternalId.startsWith("fp_") ? rawExternalId : null;
  if (sourceId) return sourceId;
  if (!mapped) return rawExternalId;

  return deriveRecordFingerprint({
    name: mapped.name,
    email: mapped.email,
    phone: mapped.phone,
    orgName: mapped.orgName,
  });
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

export async function listConnections(workspaceId: string) {
  const rows = await db
    .select({
      id: integrationConnections.id,
      provider: integrationConnections.provider,
      displayName: integrationConnections.displayName,
      externalAccountId: integrationConnections.externalAccountId,
      status: integrationConnections.status,
      grantedScopes: integrationConnections.grantedScopes,
      config: integrationConnections.config,
      lastSyncAt: integrationConnections.lastSyncAt,
      lastError: integrationConnections.lastError,
      tokenExpiresAt: integrationConnections.tokenExpiresAt,
      createdAt: integrationConnections.createdAt,
    })
    .from(integrationConnections)
    .where(eq(integrationConnections.workspaceId, workspaceId))
    .orderBy(asc(integrationConnections.createdAt));

  return rows;
}

export async function createConnection(
  workspaceId: string,
  userId: string,
  input: CreateConnectionInput,
) {
  const [connection] = await db
    .insert(integrationConnections)
    .values({
      workspaceId,
      userId,
      provider: input.provider,
      displayName: input.displayName,
      externalAccountId: input.externalAccountId,
      status: "connected",
      grantedScopes: input.grantedScopes,
      accessTokenEncrypted: encryptSecretToken(input.accessToken, tokenSecret()),
      refreshTokenEncrypted: input.refreshToken
        ? encryptSecretToken(input.refreshToken, tokenSecret())
        : null,
      tokenExpiresAt: input.tokenExpiresAt,
      config: input.config,
    })
    .onConflictDoUpdate({
      target: [
        integrationConnections.workspaceId,
        integrationConnections.provider,
        integrationConnections.externalAccountId,
      ],
      set: {
        displayName: input.displayName,
        status: "connected",
        grantedScopes: input.grantedScopes,
        accessTokenEncrypted: encryptSecretToken(input.accessToken, tokenSecret()),
        refreshTokenEncrypted: input.refreshToken
          ? encryptSecretToken(input.refreshToken, tokenSecret())
          : null,
        tokenExpiresAt: input.tokenExpiresAt,
        config: input.config,
        lastError: null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return connection;
}

export async function updateConnection(
  workspaceId: string,
  connectionId: string,
  input: UpdateConnectionInput,
) {
  const [connection] = await db
    .update(integrationConnections)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(
        eq(integrationConnections.id, connectionId),
        eq(integrationConnections.workspaceId, workspaceId),
      ),
    )
    .returning();

  return assertFound(connection, "Connection not found");
}

export async function deleteConnection(workspaceId: string, connectionId: string) {
  const [connection] = await db
    .delete(integrationConnections)
    .where(
      and(
        eq(integrationConnections.id, connectionId),
        eq(integrationConnections.workspaceId, workspaceId),
      ),
    )
    .returning({ id: integrationConnections.id });

  return assertFound(connection, "Connection not found");
}

// ---------------------------------------------------------------------------
// API keys for inbound webhook pushes
// ---------------------------------------------------------------------------

export async function listApiKeys(workspaceId: string) {
  return db
    .select({
      id: integrationApiKeys.id,
      name: integrationApiKeys.name,
      tokenPrefix: integrationApiKeys.tokenPrefix,
      lastUsedAt: integrationApiKeys.lastUsedAt,
      revokedAt: integrationApiKeys.revokedAt,
      createdAt: integrationApiKeys.createdAt,
    })
    .from(integrationApiKeys)
    .where(eq(integrationApiKeys.workspaceId, workspaceId))
    .orderBy(asc(integrationApiKeys.createdAt));
}

/**
 * Returns the plaintext key exactly once. Only the hash is persisted, matching how
 * unsubscribe tokens are handled in sequences.
 */
export async function createApiKey(workspaceId: string, userId: string, name: string) {
  const token = createPublicToken();
  const [apiKey] = await db
    .insert(integrationApiKeys)
    .values({
      workspaceId,
      createdById: userId,
      name,
      tokenHash: hashPublicToken(token),
      tokenPrefix: token.slice(0, 8),
    })
    .returning({ id: integrationApiKeys.id, name: integrationApiKeys.name });

  return { apiKey, token };
}

export async function revokeApiKey(workspaceId: string, apiKeyId: string) {
  const [apiKey] = await db
    .update(integrationApiKeys)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(integrationApiKeys.id, apiKeyId), eq(integrationApiKeys.workspaceId, workspaceId)),
    )
    .returning({ id: integrationApiKeys.id });

  return assertFound(apiKey, "API key not found");
}

export async function resolveApiKey(token: string) {
  const apiKey = await db.query.integrationApiKeys.findFirst({
    where: eq(integrationApiKeys.tokenHash, hashPublicToken(token)),
  });

  if (!apiKey || apiKey.revokedAt) return null;

  await db
    .update(integrationApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(integrationApiKeys.id, apiKey.id));

  return apiKey;
}

// ---------------------------------------------------------------------------
// Job lifecycle
// ---------------------------------------------------------------------------

function toOptionsSnapshot(
  input: StartImportJobInput,
  provider: ImportProvider,
): ImportJobOptionsSnapshot {
  return {
    conflictPolicy: input.options.conflictPolicy,
    defaultStatus: input.options.defaultStatus ?? IMPORT_PROVIDER_DEFAULT_STATUS[provider],
    defaultOwnerId: input.options.defaultOwnerId,
    normalizeSubaddressing: input.options.normalizeSubaddressing,
    createMissingOrgs: input.options.createMissingOrgs,
    skipRecordsWithoutEmail: input.options.skipRecordsWithoutEmail,
  };
}

export async function startImportJob(
  workspaceId: string,
  userId: string,
  input: StartImportJobInput,
) {
  if (input.provider === "csv" && !input.csvContent) {
    throw new AppError("A CSV import requires file content", STATUS_CODES.UNPROCESSABLE_ENTITY);
  }

  if (!isPushProvider(input.provider) && !input.connectionId) {
    throw new AppError(
      `A ${input.provider} import requires a connected account`,
      STATUS_CODES.BAD_REQUEST,
    );
  }

  if (input.connectionId) {
    const connection = await db.query.integrationConnections.findFirst({
      where: and(
        eq(integrationConnections.id, input.connectionId),
        eq(integrationConnections.workspaceId, workspaceId),
      ),
    });
    assertFound(connection, "Connection not found");
  }

  const [job] = await db
    .insert(importJobs)
    .values({
      workspaceId,
      connectionId: input.connectionId,
      createdById: userId,
      provider: input.provider,
      entityType: input.entityType,
      status: "pending",
      mapping: { fields: input.mapping.fields },
      options: toOptionsSnapshot(input, input.provider),
      sourceConfig: input.sourceConfig,
      stats: { ...EMPTY_STATS },
      nextAttemptAt: new Date(),
    })
    .returning();

  const created = assertFound(job, "Import job could not be created");

  // CSV arrives complete, so it is staged inline and lands in review immediately rather
  // than waiting a worker tick.
  if (input.provider === "csv" && input.csvContent) {
    const parsed = parseCsv(input.csvContent);
    if (parsed.rows.length > IMPORT_MAX_RECORDS_PER_JOB) {
      throw new AppError(
        `Imports are limited to ${IMPORT_MAX_RECORDS_PER_JOB} rows per run`,
        STATUS_CODES.UNPROCESSABLE_ENTITY,
      );
    }

    await stageRecords(
      created.id,
      workspaceId,
      parsed.rows.map((row, index) => ({ externalId: null, data: row, rowNumber: index + 1 })),
    );

    const mapping =
      input.mapping.fields.length > 0
        ? input.mapping.fields
        : autoDetectMapping(parsed.headers, input.entityType);

    await db
      .update(importJobs)
      .set({ mapping: { fields: mapping }, updatedAt: new Date() })
      .where(eq(importJobs.id, created.id));

    return evaluateJob(created.id);
  }

  return created;
}

type StagedRecord = {
  externalId: string | null;
  data: Record<string, unknown>;
  rowNumber: number;
};

async function stageRecords(jobId: string, workspaceId: string, records: StagedRecord[]) {
  if (records.length === 0) return 0;

  for (let index = 0; index < records.length; index += IMPORT_LOAD_BATCH_SIZE) {
    const batch = records.slice(index, index + IMPORT_LOAD_BATCH_SIZE);
    await db
      .insert(importRecords)
      .values(
        batch.map((record) => ({
          workspaceId,
          jobId,
          externalId: record.externalId,
          rowNumber: record.rowNumber,
          raw: record.data,
          status: "pending" as const,
        })),
      )
      .onConflictDoNothing();
  }

  return records.length;
}

/**
 * Applies the job mapping to every staged record and records the match decision, without
 * touching the CRM. This is what lets a user fix a mapping and re-preview without paying
 * for another extraction.
 */
export async function evaluateJob(jobId: string) {
  const job = assertFound(
    await db.query.importJobs.findFirst({ where: eq(importJobs.id, jobId) }),
    "Import job not found",
  );

  const staged = await db
    .select()
    .from(importRecords)
    .where(eq(importRecords.jobId, jobId))
    .orderBy(asc(importRecords.rowNumber));

  // Pass one is pure: map every row and settle its effective external id before any lookup
  // is built, so fingerprints assigned here are visible to the identity query below.
  const prepared = staged.map((record) => {
    const mapped =
      job.entityType === "org"
        ? null
        : applyPersonMapping(record.raw, job.mapping.fields, job.options);

    return { record, mapped, externalId: effectiveExternalId(record.externalId, mapped) };
  });

  const lookups = await buildLookups(
    job.workspaceId,
    job.provider,
    prepared.map((entry) => ({ externalId: entry.externalId })),
  );

  const seenEmails = new Set<string>();
  const seenExternalIds = new Set<string>();

  let valid = 0;
  let invalid = 0;
  let duplicate = 0;

  for (const { record, externalId } of prepared) {
    if (record.status === "loaded") continue;

    const evaluated =
      job.entityType === "org"
        ? evaluateOrgRecord(record.raw, job.mapping.fields, lookups)
        : evaluatePersonRecord(record.raw, externalId, job.mapping.fields, job.options, lookups);

    // Within-run duplicates are marked rather than loaded twice. The first occurrence wins,
    // which keeps the earliest row number authoritative.
    const dedupeKey = evaluated.dedupeKey;
    const isRunDuplicate =
      (dedupeKey !== null && seenEmails.has(dedupeKey)) ||
      (externalId !== null && seenExternalIds.has(externalId));

    if (dedupeKey !== null) seenEmails.add(dedupeKey);
    if (externalId !== null) seenExternalIds.add(externalId);

    let status: "valid" | "invalid" | "duplicate" = "valid";
    if (evaluated.errors.length > 0) status = "invalid";
    else if (isRunDuplicate) status = "duplicate";

    if (status === "valid") valid += 1;
    else if (status === "invalid") invalid += 1;
    else duplicate += 1;

    await db
      .update(importRecords)
      .set({
        externalId,
        normalized: evaluated.normalized,
        errors: evaluated.errors,
        status,
        matchReason: evaluated.matchReason,
        matchPersonId: evaluated.matchPersonId,
        matchOrgId: evaluated.matchOrgId,
        updatedAt: new Date(),
      })
      .where(eq(importRecords.id, record.id));
  }

  const [updated] = await db
    .update(importJobs)
    .set({
      status: "ready_for_review",
      stats: { ...job.stats, extracted: staged.length, valid, invalid, duplicate },
      updatedAt: new Date(),
    })
    .where(eq(importJobs.id, jobId))
    .returning();

  return assertFound(updated, "Import job not found");
}

type EvaluatedRecord = {
  normalized: Record<string, unknown>;
  errors: ImportRecordError[];
  matchReason: "external_identity" | "email" | "domain" | "name" | "none";
  matchPersonId: string | null;
  matchOrgId: string | null;
  dedupeKey: string | null;
};

function evaluatePersonRecord(
  raw: Record<string, unknown>,
  externalId: string | null,
  mapping: ImportFieldMapping[],
  options: ImportJobOptionsSnapshot,
  lookups: Lookups,
): EvaluatedRecord {
  const mapped = applyPersonMapping(raw, mapping, options);
  const rawEmailField = mapping.find((field) => field.targetField === "email")?.sourceField;
  const rawEmail = rawEmailField ? ((raw[rawEmailField] as string | undefined) ?? null) : null;

  const errors = validateMappedPerson(mapped, options, rawEmail);
  const personMatch = resolvePersonMatch(
    { externalId, email: mapped.email, normalizedEmail: mapped.normalizedEmail },
    { byExternalId: lookups.identityByExternalId, byEmail: lookups.personByEmail },
  );

  const orgMatch = resolveOrgMatch(
    { domain: mapped.orgDomain, normalizedName: mapped.orgNormalizedName },
    { byDomain: lookups.orgByDomain, byNormalizedName: lookups.orgByName },
  );

  return {
    normalized: toNormalizedPayload(mapped),
    errors,
    matchReason: personMatch.reason,
    matchPersonId: personMatch.personId,
    matchOrgId: orgMatch.orgId,
    dedupeKey: mapped.normalizedEmail,
  };
}

function evaluateOrgRecord(
  raw: Record<string, unknown>,
  mapping: ImportFieldMapping[],
  lookups: Lookups,
): EvaluatedRecord {
  const mapped = applyOrgMapping(raw, mapping);
  const errors = validateMappedOrg(mapped);
  const orgMatch = resolveOrgMatch(
    { domain: mapped.domain, normalizedName: mapped.normalizedName },
    { byDomain: lookups.orgByDomain, byNormalizedName: lookups.orgByName },
  );

  return {
    normalized: { ...mapped },
    errors,
    matchReason: orgMatch.reason,
    matchPersonId: null,
    matchOrgId: orgMatch.orgId,
    dedupeKey: mapped.normalizedName,
  };
}

function toNormalizedPayload(mapped: MappedPerson): Record<string, unknown> {
  return {
    ...mapped,
    lastContactedAt: mapped.lastContactedAt ? mapped.lastContactedAt.toISOString() : null,
  };
}

type Lookups = {
  identityByExternalId: Map<string, string>;
  personByEmail: Map<string, string>;
  orgByDomain: Map<string, string>;
  orgByName: Map<string, string>;
};

/**
 * Pre-loads every lookup a job needs in a bounded number of queries, so evaluation and
 * loading do not issue one query per record.
 */
async function buildLookups(
  workspaceId: string,
  provider: ImportProvider,
  staged: { externalId: string | null }[],
): Promise<Lookups> {
  const externalIds = staged
    .map((record) => record.externalId)
    .filter((value): value is string => value !== null);

  const [identities, existingPeople, existingOrgs] = await Promise.all([
    externalIds.length === 0
      ? Promise.resolve([])
      : db
          .select({
            externalId: externalIdentities.externalId,
            personId: externalIdentities.personId,
          })
          .from(externalIdentities)
          .where(
            and(
              eq(externalIdentities.workspaceId, workspaceId),
              eq(externalIdentities.provider, provider),
              inArray(externalIdentities.externalId, externalIds),
              isNotNull(externalIdentities.personId),
            ),
          ),
    db
      .select({ id: people.id, email: people.email })
      .from(people)
      .where(and(eq(people.workspaceId, workspaceId), isNotNull(people.email))),
    db
      .select({ id: org.id, name: org.name, domain: org.domain })
      .from(org)
      .where(eq(org.workspaceId, workspaceId)),
  ]);

  const identityByExternalId = new Map<string, string>();
  for (const identity of identities) {
    if (identity.personId) identityByExternalId.set(identity.externalId, identity.personId);
  }

  const personByEmail = new Map<string, string>();
  for (const person of existingPeople) {
    if (person.email) personByEmail.set(person.email.toLowerCase(), person.id);
  }

  const orgByDomain = new Map<string, string>();
  const orgByName = new Map<string, string>();
  for (const organization of existingOrgs) {
    const domain = organization.domain ? normalizeDomain(organization.domain) : null;
    if (domain && !orgByDomain.has(domain)) orgByDomain.set(domain, organization.id);

    const normalizedName = normalizeOrgKey(organization.name);
    if (normalizedName && !orgByName.has(normalizedName)) {
      orgByName.set(normalizedName, organization.id);
    }
  }

  return { identityByExternalId, personByEmail, orgByDomain, orgByName };
}

function normalizeOrgKey(name: string) {
  return name.toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim() || null;
}

export async function updateImportJob(
  workspaceId: string,
  jobId: string,
  input: UpdateImportJobInput,
) {
  const job = assertFound(
    await db.query.importJobs.findFirst({
      where: and(eq(importJobs.id, jobId), eq(importJobs.workspaceId, workspaceId)),
    }),
    "Import job not found",
  );

  if (job.status === "loading" || job.status === "completed") {
    throw new AppError(
      "A job that has started loading can no longer be remapped",
      STATUS_CODES.CONFLICT,
    );
  }

  await db
    .update(importJobs)
    .set({
      mapping: input.mapping ? { fields: input.mapping.fields } : job.mapping,
      options: input.options ? { ...job.options, ...input.options } : job.options,
      updatedAt: new Date(),
    })
    .where(eq(importJobs.id, jobId));

  // Re-evaluating replays the mapping over staged rows; the source is never re-fetched.
  return evaluateJob(jobId);
}

export async function commitImportJob(workspaceId: string, jobId: string) {
  const job = assertFound(
    await db.query.importJobs.findFirst({
      where: and(eq(importJobs.id, jobId), eq(importJobs.workspaceId, workspaceId)),
    }),
    "Import job not found",
  );

  if (job.status !== "ready_for_review") {
    throw new AppError(
      `Only a job awaiting review can be committed, this one is ${job.status}`,
      STATUS_CODES.CONFLICT,
    );
  }

  const [updated] = await db
    .update(importJobs)
    .set({
      status: "loading",
      startedAt: new Date(),
      nextAttemptAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(importJobs.id, jobId))
    .returning();

  return assertFound(updated, "Import job not found");
}

export async function cancelImportJob(workspaceId: string, jobId: string) {
  const [job] = await db
    .update(importJobs)
    .set({ status: "canceled", completedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(importJobs.id, jobId),
        eq(importJobs.workspaceId, workspaceId),
        inArray(importJobs.status, ["pending", "extracting", "ready_for_review", "loading"]),
      ),
    )
    .returning();

  return assertFound(job, "No cancelable import job was found");
}

export async function listImportJobs(workspaceId: string, query: ListImportJobsQuery) {
  const conditions = [eq(importJobs.workspaceId, workspaceId)];
  if (query.provider) conditions.push(eq(importJobs.provider, query.provider));
  if (query.status) conditions.push(eq(importJobs.status, query.status));

  const whereClause = and(...conditions);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(importJobs)
      .where(whereClause)
      .orderBy(sql`${importJobs.createdAt} desc`)
      .limit(query.pageSize)
      .offset(offset),
    db.select({ totalCount: count() }).from(importJobs).where(whereClause),
  ]);

  const totalCount = Number(totalResult[0]?.totalCount ?? 0);

  return {
    jobs: rows,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize),
    },
  };
}

export async function getImportJob(workspaceId: string, jobId: string) {
  const job = await db.query.importJobs.findFirst({
    where: and(eq(importJobs.id, jobId), eq(importJobs.workspaceId, workspaceId)),
  });

  return assertFound(job, "Import job not found");
}

export async function listImportRecords(
  workspaceId: string,
  jobId: string,
  query: ListImportRecordsQuery,
) {
  await getImportJob(workspaceId, jobId);

  const conditions = [eq(importRecords.jobId, jobId)];
  if (query.status) conditions.push(eq(importRecords.status, query.status));

  const whereClause = and(...conditions);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(importRecords)
      .where(whereClause)
      .orderBy(asc(importRecords.rowNumber))
      .limit(query.pageSize)
      .offset(offset),
    db.select({ totalCount: count() }).from(importRecords).where(whereClause),
  ]);

  const totalCount = Number(totalResult[0]?.totalCount ?? 0);

  return {
    records: rows,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      totalCount,
      totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize),
    },
  };
}

export async function previewSourceFields(
  workspaceId: string,
  connectionId: string,
  entityType: ImportEntityType,
) {
  const connection = assertFound(
    await db.query.integrationConnections.findFirst({
      where: and(
        eq(integrationConnections.id, connectionId),
        eq(integrationConnections.workspaceId, workspaceId),
      ),
    }),
    "Connection not found",
  );

  const fields = await listSourceFields(connection.provider, {
    auth: connectionAuth(connection),
    config: connection.config,
    cursor: null,
    pageSize: IMPORT_EXTRACT_PAGE_SIZE,
    fetchImpl: fetch,
  });

  return { fields, suggestedMapping: autoDetectMapping(fields, entityType) };
}

function connectionAuth(connection: {
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
}) {
  return {
    accessToken: decryptSecretToken(connection.accessTokenEncrypted, tokenSecret()),
    refreshToken: connection.refreshTokenEncrypted
      ? decryptSecretToken(connection.refreshTokenEncrypted, tokenSecret())
      : null,
  };
}

// ---------------------------------------------------------------------------
// Inbound webhook
// ---------------------------------------------------------------------------

/**
 * Stages a pushed batch as its own completed-extraction job. Every push runs through the
 * same staging, mapping, and matching path as a CSV or a connector, so a Zapier scenario
 * gets identical dedupe behaviour to a native integration.
 */
export async function ingestWebhookRecords(workspaceId: string, input: WebhookIngestInput) {
  const [job] = await db
    .insert(importJobs)
    .values({
      workspaceId,
      provider: "webhook",
      entityType: input.entityType,
      status: "pending",
      mapping: { fields: [] },
      options: {
        conflictPolicy: "fill_empty",
        defaultStatus: IMPORT_PROVIDER_DEFAULT_STATUS.webhook,
        defaultOwnerId: null,
        normalizeSubaddressing: false,
        createMissingOrgs: true,
        skipRecordsWithoutEmail: false,
      },
      sourceConfig: {},
      stats: { ...EMPTY_STATS },
    })
    .returning();

  const created = assertFound(job, "Import job could not be created");

  const fieldNames = new Set<string>();
  for (const record of input.records) {
    for (const key of Object.keys(record)) fieldNames.add(key);
  }

  await stageRecords(
    created.id,
    workspaceId,
    input.records.map((record, index) => {
      const { externalId, ...rest } = record;
      return {
        externalId: externalId ?? null,
        data: rest as Record<string, unknown>,
        rowNumber: index + 1,
      };
    }),
  );

  await db
    .update(importJobs)
    .set({
      mapping: { fields: autoDetectMapping([...fieldNames], input.entityType) },
      updatedAt: new Date(),
    })
    .where(eq(importJobs.id, created.id));

  const evaluated = await evaluateJob(created.id);

  // Pushes are unattended, so they commit straight through instead of waiting for review.
  await db
    .update(importJobs)
    .set({ status: "loading", startedAt: new Date(), nextAttemptAt: new Date() })
    .where(eq(importJobs.id, created.id));

  return { jobId: evaluated.id, staged: input.records.length };
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

/**
 * Worker entry point, mirroring `executeDueSequenceWork`. Claims due jobs and advances each
 * by one unit of work — a single extraction page or a single load batch — so no tick holds
 * a long transaction or blocks other jobs.
 */
export async function executeDueImportWork(now = new Date()) {
  const due = await db
    .select({ id: importJobs.id, status: importJobs.status })
    .from(importJobs)
    .where(
      and(
        inArray(importJobs.status, ["pending", "extracting", "loading"]),
        or(lte(importJobs.nextAttemptAt, now), sql`${importJobs.nextAttemptAt} is null`),
      ),
    )
    .orderBy(asc(importJobs.nextAttemptAt))
    .limit(10);

  const results: { jobId: string; outcome: string }[] = [];

  for (const entry of due) {
    try {
      const outcome =
        entry.status === "loading"
          ? await runLoadBatch(entry.id, now)
          : await runExtractionPage(entry.id, now);
      results.push({ jobId: entry.id, outcome });
    } catch (error) {
      results.push({ jobId: entry.id, outcome: "failed" });
      await handleJobFailure(entry.id, error, now);
    }
  }

  return results;
}

async function handleJobFailure(jobId: string, error: unknown, now: Date) {
  const job = await db.query.importJobs.findFirst({ where: eq(importJobs.id, jobId) });
  if (!job) return;

  const message = error instanceof Error ? error.message : "Unknown import failure";

  // A rate limit is not a failure — it is a scheduling instruction. The cursor is already
  // persisted, so the run resumes from where it stopped.
  if (error instanceof RateLimitError) {
    await db
      .update(importJobs)
      .set({
        nextAttemptAt: new Date(now.getTime() + error.retryAfterMs),
        lastError: message,
        updatedAt: new Date(),
      })
      .where(eq(importJobs.id, jobId));
    return;
  }

  // Credentials cannot fix themselves by retrying, so the job stops and the connection is
  // flagged for the user to reconnect.
  if (error instanceof ConnectionAuthError) {
    await db
      .update(importJobs)
      .set({ status: "failed", lastError: message, completedAt: now, updatedAt: new Date() })
      .where(eq(importJobs.id, jobId));

    if (job.connectionId) {
      await db
        .update(integrationConnections)
        .set({ status: "reconnect_required", lastError: message, updatedAt: new Date() })
        .where(eq(integrationConnections.id, job.connectionId));
    }
    return;
  }

  const attempts = job.attempts + 1;
  const exhausted = attempts >= MAX_JOB_ATTEMPTS;

  await db
    .update(importJobs)
    .set({
      attempts,
      status: exhausted ? "failed" : job.status,
      lastError: message,
      completedAt: exhausted ? now : null,
      // Exponential backoff, matching the retry shape used for sequence steps.
      nextAttemptAt: exhausted ? null : new Date(now.getTime() + 2 ** attempts * 30_000),
      updatedAt: new Date(),
    })
    .where(eq(importJobs.id, jobId));
}

async function runExtractionPage(jobId: string, now: Date) {
  const job = assertFound(
    await db.query.importJobs.findFirst({ where: eq(importJobs.id, jobId) }),
    "Import job not found",
  );

  // Push providers have nothing to pull; their records were staged at ingest time.
  if (isPushProvider(job.provider)) {
    await evaluateJob(jobId);
    return "evaluated";
  }

  const connection = job.connectionId
    ? await db.query.integrationConnections.findFirst({
        where: eq(integrationConnections.id, job.connectionId),
      })
    : null;

  if (!connection) {
    throw new AppError("Import job has no usable connection", STATUS_CODES.BAD_REQUEST);
  }

  await db
    .update(importJobs)
    .set({ status: "extracting", startedAt: job.startedAt ?? now, updatedAt: new Date() })
    .where(eq(importJobs.id, jobId));

  const page = await extractPage(job.provider, {
    auth: connectionAuth(connection),
    config: { ...connection.config, ...job.sourceConfig },
    cursor: job.cursor ?? null,
    pageSize: IMPORT_EXTRACT_PAGE_SIZE,
    fetchImpl: fetch,
  });

  const [{ existing } = { existing: 0 }] = await db
    .select({ existing: count() })
    .from(importRecords)
    .where(eq(importRecords.jobId, jobId));

  const offset = Number(existing);
  await stageRecords(
    jobId,
    job.workspaceId,
    page.records.map((record, index) => ({
      externalId: record.externalId,
      data: record.data,
      rowNumber: offset + index + 1,
    })),
  );

  const extracted = offset + page.records.length;
  const reachedLimit = extracted >= IMPORT_MAX_RECORDS_PER_JOB;

  if (page.nextCursor && !reachedLimit) {
    await db
      .update(importJobs)
      .set({
        cursor: page.nextCursor as ImportCursor,
        stats: { ...job.stats, extracted },
        nextAttemptAt: now,
        updatedAt: new Date(),
      })
      .where(eq(importJobs.id, jobId));

    return "extracted_page";
  }

  await db
    .update(importJobs)
    .set({
      cursor: null,
      stats: { ...job.stats, extracted },
      updatedAt: new Date(),
    })
    .where(eq(importJobs.id, jobId));

  // Mapping is auto-detected on first completion only when the user supplied none.
  if (job.mapping.fields.length === 0) {
    const fieldNames = new Set<string>();
    for (const record of page.records) {
      for (const key of Object.keys(record.data)) fieldNames.add(key);
    }

    await db
      .update(importJobs)
      .set({
        mapping: { fields: autoDetectMapping([...fieldNames], job.entityType) },
        updatedAt: new Date(),
      })
      .where(eq(importJobs.id, jobId));
  }

  await evaluateJob(jobId);
  await db
    .update(integrationConnections)
    .set({ lastSyncAt: now, lastError: null, updatedAt: new Date() })
    .where(eq(integrationConnections.id, connection.id));

  return "extraction_complete";
}

/**
 * Loads one batch. Deliberately not one transaction for the whole job: a 5,000-row import
 * must not hold a single long transaction, and a failure at row 4,900 must not roll back
 * the 4,899 rows that already succeeded.
 */
async function runLoadBatch(jobId: string, now: Date) {
  const job = assertFound(
    await db.query.importJobs.findFirst({ where: eq(importJobs.id, jobId) }),
    "Import job not found",
  );

  const batch = await db
    .select()
    .from(importRecords)
    .where(and(eq(importRecords.jobId, jobId), eq(importRecords.status, "valid")))
    .orderBy(asc(importRecords.rowNumber))
    .limit(IMPORT_LOAD_BATCH_SIZE);

  if (batch.length === 0) {
    const [completed] = await db
      .update(importJobs)
      .set({ status: "completed", completedAt: now, nextAttemptAt: null, updatedAt: new Date() })
      .where(eq(importJobs.id, jobId))
      .returning();

    return completed ? "completed" : "noop";
  }

  const lookups = await buildLookups(job.workspaceId, job.provider, batch);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const record of batch) {
    try {
      const result = await db.transaction(async (tx) =>
        job.entityType === "org"
          ? loadOrgRecord(tx, job, record, lookups)
          : loadPersonRecord(tx, job, record, lookups),
      );

      if (result === "created") created += 1;
      else if (result === "updated") updated += 1;
      else skipped += 1;

      await db
        .update(importRecords)
        .set({ status: "loaded", updatedAt: new Date() })
        .where(eq(importRecords.id, record.id));
    } catch (error) {
      // A single bad row must not fail the run. It is marked and the batch continues.
      skipped += 1;
      await db
        .update(importRecords)
        .set({
          status: "invalid",
          errors: [
            {
              field: "record",
              message: error instanceof Error ? error.message : "Failed to load record",
            },
          ],
          updatedAt: new Date(),
        })
        .where(eq(importRecords.id, record.id));
    }
  }

  await db
    .update(importJobs)
    .set({
      stats: {
        ...job.stats,
        created: job.stats.created + created,
        updated: job.stats.updated + updated,
        skipped: job.stats.skipped + skipped,
      },
      nextAttemptAt: now,
      updatedAt: new Date(),
    })
    .where(eq(importJobs.id, jobId));

  return "loaded_batch";
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function loadPersonRecord(
  tx: Tx,
  job: { workspaceId: string; provider: ImportProvider; options: ImportJobOptionsSnapshot },
  record: { id: string; externalId: string | null; normalized: Record<string, unknown> | null },
  lookups: Lookups,
) {
  const mapped = record.normalized as unknown as MappedPerson | null;
  if (!mapped) return "skipped" as const;

  const orgId = await resolveOrgId(tx, job, mapped, lookups);

  const match = resolvePersonMatch(
    {
      externalId: record.externalId,
      email: mapped.email,
      normalizedEmail: mapped.normalizedEmail,
    },
    { byExternalId: lookups.identityByExternalId, byEmail: lookups.personByEmail },
  );

  const lastContactedAt = mapped.lastContactedAt ? new Date(mapped.lastContactedAt) : null;

  if (match.personId) {
    const existing = await tx.query.people.findFirst({ where: eq(people.id, match.personId) });
    if (existing && shouldSkipExistingRecord(job.options.conflictPolicy)) {
      // Still record the identity so the next run matches without re-deriving it.
      await upsertIdentity(tx, job, record.externalId, match.personId, null);
      return "skipped" as const;
    }

    if (existing) {
      const policy = fieldPolicy(job.options.conflictPolicy);
      await tx
        .update(people)
        .set({
          name: resolveFieldValue(existing.name, mapped.name, policy) ?? existing.name,
          email: resolveFieldValue(existing.email, mapped.email, policy),
          phone: resolveFieldValue(existing.phone, mapped.phone, policy),
          jobTitle: resolveFieldValue(existing.jobTitle, mapped.jobTitle, policy),
          linkedinUrl: resolveFieldValue(existing.linkedinUrl, mapped.linkedinUrl, policy),
          orgId: existing.orgId ?? orgId,
          // Status is CRM-owned once the record exists. An import never downgrades a
          // customer to a lead because a low-trust list happened to contain their address.
          lastContactedAt: pickLatestDate(existing.lastContactedAt, lastContactedAt),
          customFields: { ...(existing.customFields ?? {}), ...mapped.customFields },
          updatedAt: new Date(),
        })
        .where(eq(people.id, match.personId));

      await upsertIdentity(tx, job, record.externalId, match.personId, null);
      return "updated" as const;
    }
  }

  const [inserted] = await tx
    .insert(people)
    .values({
      workspaceId: job.workspaceId,
      orgId,
      ownerId: job.options.defaultOwnerId,
      name: mapped.name ?? mapped.email ?? "Unknown",
      email: mapped.email,
      phone: mapped.phone,
      jobTitle: mapped.jobTitle,
      linkedinUrl: mapped.linkedinUrl,
      source: "import",
      status: job.options.defaultStatus ?? IMPORT_PROVIDER_DEFAULT_STATUS[job.provider],
      lastContactedAt,
      customFields: mapped.customFields,
    })
    .onConflictDoUpdate({
      target: [people.workspaceId, people.email],
      set: { updatedAt: new Date() },
    })
    .returning({ id: people.id });

  if (!inserted) return "skipped" as const;

  // Keeping the in-memory maps current is what stops two rows with the same address inside
  // one batch from creating two people before the next lookup refresh.
  if (mapped.normalizedEmail) lookups.personByEmail.set(mapped.normalizedEmail, inserted.id);
  await upsertIdentity(tx, job, record.externalId, inserted.id, null);

  return "created" as const;
}

async function loadOrgRecord(
  tx: Tx,
  job: { workspaceId: string; provider: ImportProvider; options: ImportJobOptionsSnapshot },
  record: { externalId: string | null; normalized: Record<string, unknown> | null },
  lookups: Lookups,
) {
  const mapped = record.normalized as unknown as MappedOrg | null;
  if (!mapped?.name) return "skipped" as const;

  const match = resolveOrgMatch(
    { domain: mapped.domain, normalizedName: mapped.normalizedName },
    { byDomain: lookups.orgByDomain, byNormalizedName: lookups.orgByName },
  );

  if (match.orgId) {
    const existing = await tx.query.org.findFirst({ where: eq(org.id, match.orgId) });
    if (existing && shouldSkipExistingRecord(job.options.conflictPolicy)) {
      await upsertIdentity(tx, job, record.externalId, null, match.orgId);
      return "skipped" as const;
    }

    if (existing) {
      const policy = fieldPolicy(job.options.conflictPolicy);
      await tx
        .update(org)
        .set({
          domain: resolveFieldValue(existing.domain, mapped.domain, policy),
          industry: resolveFieldValue(existing.industry, mapped.industry, policy),
          size: resolveFieldValue(existing.size, mapped.size, policy),
          location: resolveFieldValue(existing.location, mapped.location, policy),
          customFields: { ...(existing.customFields ?? {}), ...mapped.customFields },
          updatedAt: new Date(),
        })
        .where(eq(org.id, match.orgId));

      await upsertIdentity(tx, job, record.externalId, null, match.orgId);
      return "updated" as const;
    }
  }

  const [inserted] = await tx
    .insert(org)
    .values({
      workspaceId: job.workspaceId,
      ownerId: job.options.defaultOwnerId,
      name: mapped.name,
      domain: mapped.domain,
      industry: mapped.industry,
      size: mapped.size,
      location: mapped.location,
      customFields: mapped.customFields,
    })
    .onConflictDoUpdate({
      target: [org.workspaceId, org.name],
      set: { updatedAt: new Date() },
    })
    .returning({ id: org.id });

  if (!inserted) return "skipped" as const;

  if (mapped.domain) lookups.orgByDomain.set(mapped.domain, inserted.id);
  if (mapped.normalizedName) lookups.orgByName.set(mapped.normalizedName, inserted.id);
  await upsertIdentity(tx, job, record.externalId, null, inserted.id);

  return "created" as const;
}

/**
 * Resolves or creates the organization a person belongs to. Only runs when the job opts in,
 * because inventing orgs from a low-quality list produces more cleanup than value.
 */
async function resolveOrgId(
  tx: Tx,
  job: { workspaceId: string; options: ImportJobOptionsSnapshot },
  mapped: MappedPerson,
  lookups: Lookups,
) {
  const match = resolveOrgMatch(
    { domain: mapped.orgDomain, normalizedName: mapped.orgNormalizedName },
    { byDomain: lookups.orgByDomain, byNormalizedName: lookups.orgByName },
  );

  if (match.orgId) return match.orgId;
  if (!job.options.createMissingOrgs || !mapped.orgName) return null;

  const [inserted] = await tx
    .insert(org)
    .values({
      workspaceId: job.workspaceId,
      ownerId: job.options.defaultOwnerId,
      name: mapped.orgName,
      domain: mapped.orgDomain,
    })
    .onConflictDoUpdate({
      target: [org.workspaceId, org.name],
      set: { updatedAt: new Date() },
    })
    .returning({ id: org.id });

  if (!inserted) return null;

  if (mapped.orgDomain) lookups.orgByDomain.set(mapped.orgDomain, inserted.id);
  if (mapped.orgNormalizedName) lookups.orgByName.set(mapped.orgNormalizedName, inserted.id);

  return inserted.id;
}

async function upsertIdentity(
  tx: Tx,
  job: { workspaceId: string; provider: ImportProvider },
  externalId: string | null,
  personId: string | null,
  orgId: string | null,
) {
  if (!externalId) return;

  await tx
    .insert(externalIdentities)
    .values({
      workspaceId: job.workspaceId,
      provider: job.provider,
      externalId,
      entityType: personId ? "person" : "org",
      personId,
      orgId,
      lastSeenAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        externalIdentities.workspaceId,
        externalIdentities.provider,
        externalIdentities.externalId,
      ],
      set: { personId, orgId, lastSeenAt: new Date(), updatedAt: new Date() },
    });
}

function pickLatestDate(existing: Date | null, incoming: Date | null) {
  if (!incoming) return existing;
  if (!existing) return incoming;

  return incoming > existing ? incoming : existing;
}
