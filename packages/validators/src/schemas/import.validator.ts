import { z } from "zod";
import { idSchema } from "./common.validator.js";
import {
  IMPORT_CONFLICT_POLICY_VALUES,
  IMPORT_CONNECTION_STATUS_VALUES,
  IMPORT_ENTITY_TYPE_VALUES,
  IMPORT_JOB_STATUS_VALUES,
  IMPORT_MAX_RECORDS_PER_JOB,
  IMPORT_ORG_TARGET_FIELD_VALUES,
  IMPORT_PERSON_TARGET_FIELD_VALUES,
  IMPORT_PROVIDER_VALUES,
  IMPORT_RECORD_STATUS_VALUES,
} from "../types/import.types.js";
import { personStatusSchema } from "./crm.validator.js";

export const importProviderSchema = z.enum(IMPORT_PROVIDER_VALUES);
export const importEntityTypeSchema = z.enum(IMPORT_ENTITY_TYPE_VALUES);
export const importJobStatusSchema = z.enum(IMPORT_JOB_STATUS_VALUES);
export const importRecordStatusSchema = z.enum(IMPORT_RECORD_STATUS_VALUES);
export const importConnectionStatusSchema = z.enum(IMPORT_CONNECTION_STATUS_VALUES);
export const importConflictPolicySchema = z.enum(IMPORT_CONFLICT_POLICY_VALUES);
export const importPersonTargetFieldSchema = z.enum(IMPORT_PERSON_TARGET_FIELD_VALUES);
export const importOrgTargetFieldSchema = z.enum(IMPORT_ORG_TARGET_FIELD_VALUES);

/**
 * One source column bound to one CRM destination. `customFieldId` routes the value into
 * `people.custom_fields` / `org.custom_fields` instead of a column, and is mutually
 * exclusive with `targetField`.
 */
export const importFieldMappingSchema = z
  .object({
    sourceField: z.string().trim().min(1).max(255),
    targetField: z.string().trim().min(1).max(64).nullable().default(null),
    customFieldId: idSchema.nullable().default(null),
  })
  .refine((value) => !(value.targetField && value.customFieldId), {
    message: "A mapping targets either a CRM field or a custom field, not both",
  });

export const importMappingSchema = z.object({
  fields: z.array(importFieldMappingSchema).max(200).default([]),
});

export const importJobOptionsSchema = z.object({
  conflictPolicy: importConflictPolicySchema.default("fill_empty"),
  defaultStatus: personStatusSchema.optional(),
  defaultOwnerId: idSchema.nullable().default(null),
  /**
   * Collapses Gmail-style dots and plus-addressing before matching. Off by default because
   * it is wrong for domains that treat those as distinct mailboxes.
   */
  normalizeSubaddressing: z.boolean().default(false),
  createMissingOrgs: z.boolean().default(true),
  skipRecordsWithoutEmail: z.boolean().default(false),
});

export const startImportJobSchema = z.object({
  provider: importProviderSchema,
  connectionId: idSchema.nullable().default(null),
  entityType: importEntityTypeSchema.default("person"),
  mapping: importMappingSchema.default({ fields: [] }),
  options: importJobOptionsSchema.default({
    conflictPolicy: "fill_empty",
    defaultOwnerId: null,
    normalizeSubaddressing: false,
    createMissingOrgs: true,
    skipRecordsWithoutEmail: false,
  }),
  /** Raw file contents for `csv`. Ignored by every other provider. */
  csvContent: z.string().max(20_000_000).optional(),
  /** Provider-scoped extraction settings, e.g. spreadsheet id or Calendly organization. */
  sourceConfig: z.record(z.string(), z.unknown()).default({}),
});

export const updateImportJobSchema = z.object({
  mapping: importMappingSchema.optional(),
  options: importJobOptionsSchema.partial().optional(),
});

export const listImportJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  provider: importProviderSchema.optional(),
  status: importJobStatusSchema.optional(),
});

export const listImportRecordsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
  status: importRecordStatusSchema.optional(),
});

export const importJobParamsSchema = z.object({ id: idSchema });
export const connectionParamsSchema = z.object({ id: idSchema });

export const createConnectionSchema = z.object({
  provider: importProviderSchema,
  displayName: z.string().trim().min(1).max(255),
  externalAccountId: z.string().trim().max(255).nullable().default(null),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).nullable().default(null),
  tokenExpiresAt: z.coerce.date().nullable().default(null),
  grantedScopes: z.array(z.string()).default([]),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const updateConnectionSchema = z.object({
  displayName: z.string().trim().min(1).max(255).optional(),
  status: importConnectionStatusSchema.optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Inbound webhook payload. Deliberately permissive on extra keys — unmapped fields land in
 * the staging record's raw payload and can be mapped to custom fields later.
 */
export const webhookPersonSchema = z
  .object({
    externalId: z.string().trim().max(255).optional(),
    name: z.string().trim().max(255).optional(),
    email: z.string().trim().max(255).optional(),
    phone: z.string().trim().max(50).optional(),
    jobTitle: z.string().trim().max(255).optional(),
    linkedinUrl: z.string().trim().max(500).optional(),
    orgName: z.string().trim().max(255).optional(),
    orgDomain: z.string().trim().max(255).optional(),
    status: personStatusSchema.optional(),
  })
  .passthrough();

export const webhookIngestSchema = z.object({
  entityType: importEntityTypeSchema.default("person"),
  records: z.array(webhookPersonSchema).min(1).max(IMPORT_MAX_RECORDS_PER_JOB),
});

export type ImportFieldMapping = z.infer<typeof importFieldMappingSchema>;
export type ImportMapping = z.infer<typeof importMappingSchema>;
export type ImportJobOptions = z.infer<typeof importJobOptionsSchema>;
export type StartImportJobInput = z.infer<typeof startImportJobSchema>;
export type UpdateImportJobInput = z.infer<typeof updateImportJobSchema>;
export type ListImportJobsQuery = z.infer<typeof listImportJobsQuerySchema>;
export type ListImportRecordsQuery = z.infer<typeof listImportRecordsQuerySchema>;
export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type UpdateConnectionInput = z.infer<typeof updateConnectionSchema>;
export type WebhookIngestInput = z.infer<typeof webhookIngestSchema>;
