import { z } from "zod";

export const idSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export const dateLikeSchema = z.coerce.date();
export const nullableUuidSchema = z.string().uuid().nullable().optional();

export const workspaceRoleSchema = z.enum(["admin", "member", "owner"] as const);
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
