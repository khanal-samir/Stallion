import { custom, z } from "zod";
import { dateLikeSchema, idSchema, nullableUuidSchema } from "./common.validator.js";
import {
  CUSTOM_FIELD_ENTITY_TYPE_VALUES,
  CUSTOM_FIELD_TYPE_VALUES,
  DEAL_SORT_BY_VALUES,
  DEAL_STAGE_VALUES,
  ORG_SORT_BY_VALUES,
  PERSON_SORT_BY_VALUES,
  PERSON_SOURCE_VALUES,
  PERSON_STATUS_VALUES,
  SORT_ORDER_VALUES,
} from "../types/crm.types.js";

const optionalTrimmedString = (max: number) => z.string().trim().min(1).max(max).optional();
const optionalUuidFilter = z.string().uuid().optional();

// Enums
export const personStatusSchema = z.enum(PERSON_STATUS_VALUES);
export const personSourceSchema = z.enum(PERSON_SOURCE_VALUES);
export const dealStageSchema = z.enum(DEAL_STAGE_VALUES);
export const sortOrderSchema = z.enum(SORT_ORDER_VALUES);
export const orgSortBySchema = z.enum(ORG_SORT_BY_VALUES);
export const personSortBySchema = z.enum(PERSON_SORT_BY_VALUES);
export const dealSortBySchema = z.enum(DEAL_SORT_BY_VALUES);
export const customFieldEntityTypeSchema = z.enum(CUSTOM_FIELD_ENTITY_TYPE_VALUES);
export const customFieldTypeSchema = z.enum(CUSTOM_FIELD_TYPE_VALUES);

export const customFieldOptionSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(255),
});

export const customFieldOptionInputSchema = customFieldOptionSchema.omit({ id: true });

// Base query schema for listing org, people, and deals
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
  ownerId: optionalUuidFilter,
});

export const listPeopleQuerySchema = crmListQueryBaseSchema.extend({
  sortBy: personSortBySchema.default("name"),
  status: personStatusSchema.optional(),
  source: personSourceSchema.optional(),
  ownerId: optionalUuidFilter,
});

export const listDealsQuerySchema = crmListQueryBaseSchema.extend({
  sortBy: dealSortBySchema.default("title"),
  stage: dealStageSchema.optional(),
  ownerId: optionalUuidFilter,
});

// Bulk delete schema
export const bulkDeleteSchema = z.object({
  ids: z.array(idSchema).min(1),
});

// Create and update schemas
export const createOrgSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().max(255).optional(),
  industry: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  location: z.string().max(255).optional(),
  ownerId: nullableUuidSchema,
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

export const customFieldParamsSchema = z.object({ id: idSchema });

export const createCustomFieldDefinitionSchema = z
  .object({
    label: z.string().trim().min(1).max(255),
    type: customFieldTypeSchema,
    options: z.array(customFieldOptionInputSchema).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "select" && (!value.options || value.options.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select fields must include at least one option",
        path: ["options"],
      });
    }
  });

export const updateCustomFieldDefinitionSchema = z.object({
  label: z.string().trim().min(1).max(255).optional(),
  options: z.array(customFieldOptionInputSchema).optional(),
});

export type PersonStatus = z.infer<typeof personStatusSchema>;
export type PersonSource = z.infer<typeof personSourceSchema>;
export type DealStage = z.infer<typeof dealStageSchema>;
export type SortOrder = z.infer<typeof sortOrderSchema>;
export type CustomFieldEntityType = z.infer<typeof customFieldEntityTypeSchema>;
export type CustomFieldType = z.infer<typeof customFieldTypeSchema>;
export type CustomFieldOption = z.infer<typeof customFieldOptionSchema>;

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

export type CustomFieldParams = z.infer<typeof customFieldParamsSchema>;
export type CreateCustomFieldDefinitionInput = z.infer<typeof createCustomFieldDefinitionSchema>;
export type UpdateCustomFieldDefinitionInput = z.infer<typeof updateCustomFieldDefinitionSchema>;

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
