import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./common.schema.js";
import { user } from "./auth.schema.js";
import { people } from "./crm.schema.js";
import { workspaces } from "./workspace.schema.js";
import {
  gmailConnectionStatusEnum,
  sequenceActivityTypeEnum,
  sequenceEnrollmentStatusEnum,
  sequenceEnrollmentStepStatusEnum,
  sequenceStatusEnum,
  sequenceStepTypeEnum,
  sequenceTaskStatusEnum,
  sequenceTaskTypeEnum,
} from "./enums.schema.js";
import type { SequenceSendingWindow } from "@workspace/validators/schemas/sequence";

export type SequenceStepConfig = Record<string, unknown>;

export type SequenceStepSnapshot = {
  id: string;
  type: "email" | "wait" | "linkedin_task" | "general_task";
  name: string;
  position: number;
  config: SequenceStepConfig;
};

export const sequences = pgTable(
  "sequences",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id").references(() => user.id, { onDelete: "set null" }),
    latestPublishedVersionId: uuid("latest_published_version_id"),
    name: varchar("name", { length: 255 }).notNull(),
    status: sequenceStatusEnum("status").notNull().default("draft"),
    timezone: varchar("timezone", { length: 100 }).notNull().default("UTC"),
    sendingWindow: jsonb("sending_window").$type<SequenceSendingWindow>().notNull(),
    ...timestamps,
  },
  (table) => [
    index("sequences_workspace_id_idx").on(table.workspaceId),
    index("sequences_created_by_id_idx").on(table.createdById),
    index("sequences_status_idx").on(table.status),
  ],
);

export const sequenceSteps = pgTable(
  "sequence_steps",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sequenceId: uuid("sequence_id")
      .notNull()
      .references(() => sequences.id, { onDelete: "cascade" }),
    type: sequenceStepTypeEnum("type").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    position: integer("position").notNull(),
    config: jsonb("config").$type<SequenceStepConfig>().default({}).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("sequence_steps_sequence_position_unique").on(table.sequenceId, table.position),
    index("sequence_steps_workspace_id_idx").on(table.workspaceId),
    index("sequence_steps_sequence_id_idx").on(table.sequenceId),
  ],
);

export const sequenceVersions = pgTable(
  "sequence_versions",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sequenceId: uuid("sequence_id")
      .notNull()
      .references(() => sequences.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    stepsSnapshot: jsonb("steps_snapshot").$type<SequenceStepSnapshot[]>().default([]).notNull(),
    publishedById: uuid("published_by_id").references(() => user.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at").defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [
    unique("sequence_versions_sequence_version_unique").on(table.sequenceId, table.versionNumber),
    index("sequence_versions_workspace_id_idx").on(table.workspaceId),
    index("sequence_versions_sequence_id_idx").on(table.sequenceId),
  ],
);

export const gmailIntegrations = pgTable(
  "gmail_integrations",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    status: gmailConnectionStatusEnum("status").notNull().default("connected"),
    grantedScopes: jsonb("granted_scopes").$type<string[]>().default([]).notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
    tokenExpiresAt: timestamp("token_expires_at"),
    lastSyncAt: timestamp("last_sync_at"),
    timezone: varchar("timezone", { length: 100 }).notNull().default("UTC"),
    sendingWindow: jsonb("sending_window").$type<SequenceSendingWindow>().notNull(),
    dailyLimit: integer("daily_limit").notNull().default(50),
    hourlyLimit: integer("hourly_limit").notNull().default(10),
    ...timestamps,
  },
  (table) => [
    unique("gmail_integrations_workspace_user_email_unique").on(
      table.workspaceId,
      table.userId,
      table.email,
    ),
    index("gmail_integrations_workspace_id_idx").on(table.workspaceId),
    index("gmail_integrations_user_id_idx").on(table.userId),
    index("gmail_integrations_status_idx").on(table.status),
  ],
);

export const sequenceEnrollments = pgTable(
  "sequence_enrollments",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sequenceId: uuid("sequence_id")
      .notNull()
      .references(() => sequences.id, { onDelete: "cascade" }),
    versionId: uuid("version_id")
      .notNull()
      .references(() => sequenceVersions.id, { onDelete: "restrict" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    gmailIntegrationId: uuid("gmail_integration_id").references(() => gmailIntegrations.id, {
      onDelete: "set null",
    }),
    enrolledById: uuid("enrolled_by_id").references(() => user.id, { onDelete: "set null" }),
    status: sequenceEnrollmentStatusEnum("status").notNull().default("active"),
    currentPosition: integer("current_position").notNull().default(0),
    nextStepDueAt: timestamp("next_step_due_at"),
    lastError: text("last_error"),
    pausedAt: timestamp("paused_at"),
    completedAt: timestamp("completed_at"),
    ...timestamps,
  },
  (table) => [
    index("sequence_enrollments_workspace_id_idx").on(table.workspaceId),
    index("sequence_enrollments_sequence_id_idx").on(table.sequenceId),
    index("sequence_enrollments_version_id_idx").on(table.versionId),
    index("sequence_enrollments_person_id_idx").on(table.personId),
    index("sequence_enrollments_gmail_integration_id_idx").on(table.gmailIntegrationId),
    index("sequence_enrollments_status_due_idx").on(table.status, table.nextStepDueAt),
  ],
);

export const sequenceEnrollmentSteps = pgTable(
  "sequence_enrollment_steps",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => sequenceEnrollments.id, { onDelete: "cascade" }),
    stepId: uuid("step_id"),
    type: sequenceStepTypeEnum("type").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    position: integer("position").notNull(),
    stepSnapshot: jsonb("step_snapshot").$type<SequenceStepSnapshot>().notNull(),
    status: sequenceEnrollmentStepStatusEnum("status").notNull().default("pending"),
    dueAt: timestamp("due_at"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at"),
    processedAt: timestamp("processed_at"),
    lastError: text("last_error"),
    gmailMessageId: text("gmail_message_id"),
    gmailThreadId: text("gmail_thread_id"),
    createdTaskId: uuid("created_task_id"),
    ...timestamps,
  },
  (table) => [
    unique("sequence_enrollment_steps_enrollment_position_unique").on(
      table.enrollmentId,
      table.position,
    ),
    index("sequence_enrollment_steps_workspace_id_idx").on(table.workspaceId),
    index("sequence_enrollment_steps_enrollment_id_idx").on(table.enrollmentId),
    index("sequence_enrollment_steps_status_due_idx").on(table.status, table.dueAt),
    index("sequence_enrollment_steps_thread_idx").on(table.gmailThreadId),
  ],
);

export const sequenceTasks = pgTable(
  "sequence_tasks",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sequenceId: uuid("sequence_id").references(() => sequences.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id").references(() => sequenceEnrollments.id, {
      onDelete: "cascade",
    }),
    enrollmentStepId: uuid("enrollment_step_id").references(() => sequenceEnrollmentSteps.id, {
      onDelete: "set null",
    }),
    personId: uuid("person_id").references(() => people.id, { onDelete: "set null" }),
    assignedToId: uuid("assigned_to_id").references(() => user.id, { onDelete: "set null" }),
    type: sequenceTaskTypeEnum("type").notNull(),
    status: sequenceTaskStatusEnum("status").notNull().default("open"),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull().default(""),
    dueAt: timestamp("due_at").notNull(),
    completedAt: timestamp("completed_at"),
    ...timestamps,
  },
  (table) => [
    index("sequence_tasks_workspace_id_idx").on(table.workspaceId),
    index("sequence_tasks_sequence_id_idx").on(table.sequenceId),
    index("sequence_tasks_enrollment_id_idx").on(table.enrollmentId),
    index("sequence_tasks_enrollment_step_id_idx").on(table.enrollmentStepId),
    index("sequence_tasks_person_id_idx").on(table.personId),
    index("sequence_tasks_assigned_to_id_idx").on(table.assignedToId),
    index("sequence_tasks_status_due_idx").on(table.status, table.dueAt),
  ],
);

export const sequenceActivityEvents = pgTable(
  "sequence_activity_events",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sequenceId: uuid("sequence_id").references(() => sequences.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id").references(() => sequenceEnrollments.id, {
      onDelete: "cascade",
    }),
    personId: uuid("person_id").references(() => people.id, { onDelete: "set null" }),
    type: sequenceActivityTypeEnum("type").notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sequence_activity_events_workspace_id_idx").on(table.workspaceId),
    index("sequence_activity_events_sequence_id_idx").on(table.sequenceId),
    index("sequence_activity_events_enrollment_id_idx").on(table.enrollmentId),
    index("sequence_activity_events_person_id_idx").on(table.personId),
    index("sequence_activity_events_type_idx").on(table.type),
    index("sequence_activity_events_created_at_idx").on(table.createdAt),
  ],
);

export const sequenceSuppressions = pgTable(
  "sequence_suppressions",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    reason: varchar("reason", { length: 100 }).notNull().default("unsubscribe"),
    source: varchar("source", { length: 100 }).notNull().default("public_unsubscribe"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("sequence_suppressions_workspace_email_unique").on(table.workspaceId, table.email),
    index("sequence_suppressions_workspace_id_idx").on(table.workspaceId),
    index("sequence_suppressions_email_idx").on(table.email),
  ],
);

export const sequenceUnsubscribeTokens = pgTable(
  "sequence_unsubscribe_tokens",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sequenceId: uuid("sequence_id")
      .notNull()
      .references(() => sequences.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => sequenceEnrollments.id, { onDelete: "cascade" }),
    personId: uuid("person_id").references(() => people.id, { onDelete: "set null" }),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: text("token_hash").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("sequence_unsubscribe_tokens_hash_unique").on(table.tokenHash),
    index("sequence_unsubscribe_tokens_workspace_id_idx").on(table.workspaceId),
    index("sequence_unsubscribe_tokens_enrollment_id_idx").on(table.enrollmentId),
    index("sequence_unsubscribe_tokens_email_idx").on(table.email),
  ],
);

export const sequencesRelations = relations(sequences, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [sequences.workspaceId], references: [workspaces.id] }),
  createdBy: one(user, { fields: [sequences.createdById], references: [user.id] }),
  steps: many(sequenceSteps),
  versions: many(sequenceVersions),
  enrollments: many(sequenceEnrollments),
  activityEvents: many(sequenceActivityEvents),
}));

export const sequenceStepsRelations = relations(sequenceSteps, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [sequenceSteps.workspaceId],
    references: [workspaces.id],
  }),
  sequence: one(sequences, { fields: [sequenceSteps.sequenceId], references: [sequences.id] }),
}));

export const sequenceVersionsRelations = relations(sequenceVersions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [sequenceVersions.workspaceId],
    references: [workspaces.id],
  }),
  sequence: one(sequences, {
    fields: [sequenceVersions.sequenceId],
    references: [sequences.id],
  }),
  publishedBy: one(user, { fields: [sequenceVersions.publishedById], references: [user.id] }),
  enrollments: many(sequenceEnrollments),
}));

export const gmailIntegrationsRelations = relations(gmailIntegrations, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [gmailIntegrations.workspaceId],
    references: [workspaces.id],
  }),
  user: one(user, { fields: [gmailIntegrations.userId], references: [user.id] }),
  enrollments: many(sequenceEnrollments),
}));

export const sequenceEnrollmentsRelations = relations(sequenceEnrollments, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [sequenceEnrollments.workspaceId],
    references: [workspaces.id],
  }),
  sequence: one(sequences, {
    fields: [sequenceEnrollments.sequenceId],
    references: [sequences.id],
  }),
  version: one(sequenceVersions, {
    fields: [sequenceEnrollments.versionId],
    references: [sequenceVersions.id],
  }),
  person: one(people, { fields: [sequenceEnrollments.personId], references: [people.id] }),
  gmailIntegration: one(gmailIntegrations, {
    fields: [sequenceEnrollments.gmailIntegrationId],
    references: [gmailIntegrations.id],
  }),
  enrolledBy: one(user, { fields: [sequenceEnrollments.enrolledById], references: [user.id] }),
  steps: many(sequenceEnrollmentSteps),
  tasks: many(sequenceTasks),
  activityEvents: many(sequenceActivityEvents),
}));

export const sequenceEnrollmentStepsRelations = relations(
  sequenceEnrollmentSteps,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [sequenceEnrollmentSteps.workspaceId],
      references: [workspaces.id],
    }),
    enrollment: one(sequenceEnrollments, {
      fields: [sequenceEnrollmentSteps.enrollmentId],
      references: [sequenceEnrollments.id],
    }),
    tasks: many(sequenceTasks),
  }),
);

export const sequenceTasksRelations = relations(sequenceTasks, ({ one }) => ({
  workspace: one(workspaces, { fields: [sequenceTasks.workspaceId], references: [workspaces.id] }),
  sequence: one(sequences, { fields: [sequenceTasks.sequenceId], references: [sequences.id] }),
  enrollment: one(sequenceEnrollments, {
    fields: [sequenceTasks.enrollmentId],
    references: [sequenceEnrollments.id],
  }),
  enrollmentStep: one(sequenceEnrollmentSteps, {
    fields: [sequenceTasks.enrollmentStepId],
    references: [sequenceEnrollmentSteps.id],
  }),
  person: one(people, { fields: [sequenceTasks.personId], references: [people.id] }),
  assignedTo: one(user, { fields: [sequenceTasks.assignedToId], references: [user.id] }),
}));

export const sequenceActivityEventsRelations = relations(sequenceActivityEvents, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [sequenceActivityEvents.workspaceId],
    references: [workspaces.id],
  }),
  sequence: one(sequences, {
    fields: [sequenceActivityEvents.sequenceId],
    references: [sequences.id],
  }),
  enrollment: one(sequenceEnrollments, {
    fields: [sequenceActivityEvents.enrollmentId],
    references: [sequenceEnrollments.id],
  }),
  person: one(people, { fields: [sequenceActivityEvents.personId], references: [people.id] }),
}));
