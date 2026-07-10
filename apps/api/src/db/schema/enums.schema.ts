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

export const crmCustomFieldEntityTypeEnum = pgEnum("crm_custom_field_entity_type", [
  "people",
  "org",
]);

export const crmCustomFieldTypeEnum = pgEnum("crm_custom_field_type", [
  "text",
  "number",
  "select",
  "dateTime",
]);

export const sequenceStatusEnum = pgEnum("sequence_status", [
  "draft",
  "published",
  "paused",
  "archived",
]);

export const sequenceStepTypeEnum = pgEnum("sequence_step_type", [
  "email",
  "wait",
  "linkedin_task",
  "general_task",
]);

export const sequenceEnrollmentStatusEnum = pgEnum("sequence_enrollment_status", [
  "active",
  "paused",
  "failed",
  "replied",
  "completed",
  "unsubscribed",
]);

export const sequenceEnrollmentStepStatusEnum = pgEnum("sequence_enrollment_step_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "skipped",
]);

export const sequenceTaskStatusEnum = pgEnum("sequence_task_status", [
  "open",
  "completed",
  "canceled",
]);

export const sequenceTaskTypeEnum = pgEnum("sequence_task_type", [
  "linkedin_task",
  "general_task",
  "failure",
  "gmail_warning",
]);

export const sequenceActivityTypeEnum = pgEnum("sequence_activity_type", [
  "sequence_created",
  "sequence_updated",
  "sequence_published",
  "sequence_archived",
  "enrollment_started",
  "email_sent",
  "email_would_send",
  "email_failed",
  "reply_detected",
  "unsubscribed",
  "task_created",
  "task_completed",
  "paused",
  "resumed",
  "completed",
  "gmail_warning",
]);

export const gmailConnectionStatusEnum = pgEnum("gmail_connection_status", [
  "connected",
  "reconnect_required",
  "disconnected",
]);
