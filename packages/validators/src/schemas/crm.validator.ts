import { z } from "zod";
import { dateLikeSchema, idSchema, nullableUuidSchema } from "./common.validator.js";

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
  status: z.enum(["lead", "prospect", "qualified", "customer", "churned"]).optional(),
  source: z.enum(["manual", "csv", "api"]).optional(),
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
  stage: z.enum(["new", "contacted", "demo", "proposal", "won", "lost"]).optional(),
  closeDate: dateLikeSchema.optional(),
});

export const updateDealSchema = createDealSchema.partial();
export const dealParamsSchema = z.object({ id: idSchema });

export type CreateOrg = z.infer<typeof createOrgSchema>;
export type UpdateOrg = z.infer<typeof updateOrgSchema>;
export type OrgParams = z.infer<typeof orgParamsSchema>;

export type CreatePerson = z.infer<typeof createPersonSchema>;
export type UpdatePerson = z.infer<typeof updatePersonSchema>;
export type PersonParams = z.infer<typeof personParamsSchema>;

export type CreateDeal = z.infer<typeof createDealSchema>;
export type UpdateDeal = z.infer<typeof updateDealSchema>;
export type DealParams = z.infer<typeof dealParamsSchema>;
