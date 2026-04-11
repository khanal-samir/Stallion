import { z } from "zod";

export const idSchema = z.string().uuid();

export const dateLikeSchema = z.coerce.date();
export const nullableUuidSchema = z.string().uuid().nullable().optional();

export const WORKSPACE_ROLES = ["owner", "admin", "member"] as const;
export const ASSIGNABLE_WORKSPACE_ROLES = ["admin", "member"] as const;

export const workspaceRoleSchema = z.enum(WORKSPACE_ROLES);
export const assignableWorkspaceRoleSchema = z.enum(ASSIGNABLE_WORKSPACE_ROLES);

export const WORKSPACE_ROLE = workspaceRoleSchema.enum;
export const ASSIGNABLE_WORKSPACE_ROLE = assignableWorkspaceRoleSchema.enum;

export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;
export type AssignableWorkspaceRole = z.infer<typeof assignableWorkspaceRoleSchema>;
