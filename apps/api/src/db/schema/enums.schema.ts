import { pgEnum } from "drizzle-orm/pg-core";

export const workspaceRoleEnum = pgEnum("workspace_role", ["owner", "admin", "member"]);

export const workspaceInviteRoleEnum = pgEnum("workspace_invite_role", ["admin", "member"]);

export const workspaceInviteStatusEnum = pgEnum("workspace_invite_status", [
  "pending",
  "accepted",
  "rejected",
  "canceled",
]);

export const peopleStatusEnum = pgEnum("people_status", [
  "lead",
  "prospect",
  "qualified",
  "customer",
  "churned",
]);

export const peopleSourceEnum = pgEnum("people_source", ["manual", "csv", "api"]);

export const dealStageEnum = pgEnum("deal_stage", [
  "new",
  "contacted",
  "demo",
  "proposal",
  "won",
  "lost",
]);
