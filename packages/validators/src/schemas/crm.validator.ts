import { z } from "zod";
import { dateLikeSchema, idSchema, nullableUuidSchema } from "./common.validator.js";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const optionalTrimmedString = (max: number) =>
  z.preprocess(emptyStringToUndefined, z.string().trim().min(1).max(max).optional());

const optionalUuidFilter = z.preprocess(emptyStringToUndefined, z.string().uuid().optional());

export const PERSON_STATUS_VALUES = [
  "lead",
  "prospect",
  "qualified",
  "customer",
  "churned",
] as const;

export const PERSON_SOURCE_VALUES = ["manual", "csv", "api"] as const;

export const DEAL_STAGE_VALUES = ["new", "contacted", "demo", "proposal", "won", "lost"] as const;

export const ORG_SORT_BY_VALUES = [
  "name",
  "domain",
  "industry",
  "size",
  "location",
  "createdAt",
  "updatedAt",
] as const;

export const PERSON_SORT_BY_VALUES = [
  "name",
  "email",
  "phone",
  "jobTitle",
  "status",
  "source",
  "lastContactedAt",
  "createdAt",
  "updatedAt",
] as const;

export const DEAL_SORT_BY_VALUES = [
  "title",
  "value",
  "currency",
  "stage",
  "closeDate",
  "createdAt",
  "updatedAt",
] as const;

export const SORT_ORDER_VALUES = ["asc", "desc"] as const;

export const personStatusSchema = z.enum(PERSON_STATUS_VALUES);
export const personSourceSchema = z.enum(PERSON_SOURCE_VALUES);
export const dealStageSchema = z.enum(DEAL_STAGE_VALUES);
export const sortOrderSchema = z.enum(SORT_ORDER_VALUES);
export const orgSortBySchema = z.enum(ORG_SORT_BY_VALUES);
export const personSortBySchema = z.enum(PERSON_SORT_BY_VALUES);
export const dealSortBySchema = z.enum(DEAL_SORT_BY_VALUES);

export const crmListQueryBaseSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  sortOrder: sortOrderSchema.default("asc"),
  search: optionalTrimmedString(255),
});

export const listOrgsQuerySchema = crmListQueryBaseSchema.extend({
  sortBy: orgSortBySchema.default("name"),
  industry: optionalTrimmedString(100),
  size: optionalTrimmedString(50),
});

export const listPeopleQuerySchema = crmListQueryBaseSchema.extend({
  sortBy: personSortBySchema.default("name"),
  status: z.preprocess(emptyStringToUndefined, personStatusSchema.optional()),
  source: z.preprocess(emptyStringToUndefined, personSourceSchema.optional()),
  ownerId: optionalUuidFilter,
});

export const listDealsQuerySchema = crmListQueryBaseSchema.extend({
  sortBy: dealSortBySchema.default("title"),
  stage: z.preprocess(emptyStringToUndefined, dealStageSchema.optional()),
  ownerId: optionalUuidFilter,
});

export const bulkDeleteSchema = z.object({
  ids: z.array(idSchema).min(1),
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

export type PersonStatus = z.infer<typeof personStatusSchema>;
export type PersonSource = z.infer<typeof personSourceSchema>;
export type DealStage = z.infer<typeof dealStageSchema>;
export type SortOrder = z.infer<typeof sortOrderSchema>;

export type CreateOrg = z.infer<typeof createOrgSchema>;
export type UpdateOrg = z.infer<typeof updateOrgSchema>;
export type OrgParams = z.infer<typeof orgParamsSchema>;
export type ListOrgsQuery = z.infer<typeof listOrgsQuerySchema>;

export type CreatePerson = z.infer<typeof createPersonSchema>;
export type UpdatePerson = z.infer<typeof updatePersonSchema>;
export type PersonParams = z.infer<typeof personParamsSchema>;
export type ListPeopleQuery = z.infer<typeof listPeopleQuerySchema>;

export type CreateDeal = z.infer<typeof createDealSchema>;
export type UpdateDeal = z.infer<typeof updateDealSchema>;
export type DealParams = z.infer<typeof dealParamsSchema>;
export type ListDealsQuery = z.infer<typeof listDealsQuerySchema>;

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
