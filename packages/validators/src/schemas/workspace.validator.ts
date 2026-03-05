import { z } from "zod";
import { idSchema, dateLikeSchema } from "./common.validator.js";

export const workspaceSlugSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and hyphenated");

export const workspaceSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(255),
  ownerId: idSchema,
  slug: workspaceSlugSchema,
  logo: z.string().url().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: dateLikeSchema.optional(),
  updatedAt: dateLikeSchema.optional(),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: workspaceSlugSchema.optional(),
  logo: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();
export const workspaceParamsSchema = z.object({ id: idSchema });

export type Workspace = z.infer<typeof workspaceSchema>;
export type CreateWorkspace = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspace = z.infer<typeof updateWorkspaceSchema>;
export type WorkspaceParams = z.infer<typeof workspaceParamsSchema>;
