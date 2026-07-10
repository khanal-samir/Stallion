export const SEQUENCE_STATUS_VALUES = ["draft", "published", "paused", "archived"] as const;

export const SEQUENCE_STEP_TYPE_VALUES = [
  "email",
  "wait",
  "linkedin_task",
  "general_task",
] as const;

export const SEQUENCE_ENROLLMENT_STATUS_VALUES = [
  "active",
  "paused",
  "failed",
  "replied",
  "completed",
  "unsubscribed",
] as const;

export const SEQUENCE_ENROLLMENT_STEP_STATUS_VALUES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "skipped",
] as const;

export const SEQUENCE_TASK_STATUS_VALUES = ["open", "completed", "canceled"] as const;

export const SEQUENCE_TASK_TYPE_VALUES = [
  "linkedin_task",
  "general_task",
  "failure",
  "gmail_warning",
] as const;

export const SEQUENCE_ACTIVITY_TYPE_VALUES = [
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
] as const;

export const GMAIL_CONNECTION_STATUS_VALUES = [
  "connected",
  "reconnect_required",
  "disconnected",
] as const;

export const DEFAULT_SEQUENCE_SENDING_WINDOW = {
  weekdays: [1, 2, 3, 4, 5],
  startHour: 9,
  endHour: 17,
} as const;

export const DEFAULT_GMAIL_DAILY_LIMIT = 50;
export const DEFAULT_GMAIL_HOURLY_LIMIT = 10;
