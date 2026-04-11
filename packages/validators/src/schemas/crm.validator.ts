import { z } from "zod";
import { dateLikeSchema, idSchema, nullableUuidSchema } from "./common.validator.js";

// ── Common schemas ───────────────────────────────────────────────────────────
export const personStatusSchema = z.enum(["lead", "prospect", "qualified", "customer", "churned"]);
export const personSourceSchema = z.enum(["manual", "csv", "api"]);
export const dealStageSchema = z.enum(["new", "contacted", "demo", "proposal", "won", "lost"]);

export const listMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

const relatedEntitySchema = z.object({ id: idSchema, name: z.string() });

// ── Org schemas ──────────────────────────────────────────────────────────────

export const orgSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  name: z.string(),
  domain: z.string().nullable(),
  industry: z.string().nullable(),
  size: z.string().nullable(),
  location: z.string().nullable(),
  customFields: z.record(z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  people: z.array(relatedEntitySchema).optional(),
  peopleCount: z.number().int().nonnegative().optional(),
});

export const createOrgSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().max(255).optional(),
  industry: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  location: z.string().max(255).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const updateOrgSchema = createOrgSchema.partial();
export const orgParamsSchema = z.object({ id: idSchema });

export const orgsListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z
    .enum(["name", "domain", "industry", "size", "location", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().max(255).optional(),
  industry: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
});

// ── Person schemas ───────────────────────────────────────────────────────────

export const personSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  orgId: z.string().uuid().nullable(),
  ownerId: z.string().uuid().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  jobTitle: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  status: personStatusSchema,
  source: personSourceSchema,
  lastContactedAt: z.string().nullable(),
  customFields: z.record(z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  orgName: z.string().optional(),
  ownerName: z.string().optional(),
  org: relatedEntitySchema.nullable().optional(),
  owner: relatedEntitySchema.nullable().optional(),
});

export const createPersonSchema = z.object({
  name: z.string().min(1).max(255),
  orgId: nullableUuidSchema,
  ownerId: nullableUuidSchema,
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(255).optional(),
  linkedinUrl: z.string().url().max(500).optional(),
  status: personStatusSchema.optional(),
  source: personSourceSchema.optional(),
  lastContactedAt: dateLikeSchema.optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const updatePersonSchema = createPersonSchema.partial();
export const personParamsSchema = z.object({ id: idSchema });

export const peopleListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z
    .enum(["name", "email", "jobTitle", "status", "source", "lastContactedAt", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().max(255).optional(),
  status: personStatusSchema.optional(),
  source: personSourceSchema.optional(),
  ownerId: idSchema.optional(),
});

// ── Deal schemas ─────────────────────────────────────────────────────────────

export const dealSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  personId: z.string().uuid().nullable(),
  orgId: z.string().uuid().nullable(),
  ownerId: z.string().uuid().nullable(),
  title: z.string(),
  value: z.string().nullable(),
  currency: z.string(),
  stage: dealStageSchema,
  closeDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  person: relatedEntitySchema.nullable().optional(),
  org: relatedEntitySchema.nullable().optional(),
  ownerName: z.string().optional(),
});

export const createDealSchema = z.object({
  title: z.string().min(1).max(255),
  personId: nullableUuidSchema,
  orgId: nullableUuidSchema,
  ownerId: nullableUuidSchema,
  value: z.string().optional(),
  currency: z.string().length(3).optional(),
  stage: dealStageSchema.optional(),
  closeDate: dateLikeSchema.optional(),
});

export const updateDealSchema = createDealSchema.partial();
export const dealParamsSchema = z.object({ id: idSchema });
export const dealsListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().max(255).optional(),
  stage: dealStageSchema.optional(),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(idSchema).min(1).max(500),
});

// ── Inferred types ───────────────────────────────────────────────────────────

export type CreateOrg = z.infer<typeof createOrgSchema>;
export type UpdateOrg = z.infer<typeof updateOrgSchema>;
export type OrgParams = z.infer<typeof orgParamsSchema>;
export type OrgsListQuery = z.infer<typeof orgsListQuerySchema>;
export type Org = z.infer<typeof orgSchema>;
export type OrgListParams = OrgsListQuery;
export type ListMeta = z.infer<typeof listMetaSchema>;

export type CreatePerson = z.infer<typeof createPersonSchema>;
export type UpdatePerson = z.infer<typeof updatePersonSchema>;
export type PersonParams = z.infer<typeof personParamsSchema>;
export type PeopleListQuery = z.infer<typeof peopleListQuerySchema>;
export type Person = z.infer<typeof personSchema>;
export type PersonListParams = PeopleListQuery;
export type PersonStatus = z.infer<typeof personStatusSchema>;
export type PersonSource = z.infer<typeof personSourceSchema>;

export type CreateDeal = z.infer<typeof createDealSchema>;
export type UpdateDeal = z.infer<typeof updateDealSchema>;
export type DealParams = z.infer<typeof dealParamsSchema>;
export type Deal = z.infer<typeof dealSchema>;
export type DealListParams = z.infer<typeof dealsListQuerySchema>;
export type DealStage = z.infer<typeof dealStageSchema>;

export type BulkDelete = z.infer<typeof bulkDeleteSchema>;
