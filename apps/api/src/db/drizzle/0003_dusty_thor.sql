CREATE TYPE "public"."gmail_connection_status" AS ENUM('connected', 'reconnect_required', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."sequence_activity_type" AS ENUM('sequence_created', 'sequence_updated', 'sequence_published', 'sequence_archived', 'enrollment_started', 'email_sent', 'email_would_send', 'email_failed', 'reply_detected', 'unsubscribed', 'task_created', 'task_completed', 'paused', 'resumed', 'completed', 'gmail_warning');--> statement-breakpoint
CREATE TYPE "public"."sequence_enrollment_status" AS ENUM('active', 'paused', 'failed', 'replied', 'completed', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."sequence_enrollment_step_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."sequence_status" AS ENUM('draft', 'published', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."sequence_step_type" AS ENUM('email', 'wait', 'linkedin_task', 'general_task');--> statement-breakpoint
CREATE TYPE "public"."sequence_task_status" AS ENUM('open', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."sequence_task_type" AS ENUM('linkedin_task', 'general_task', 'failure', 'gmail_warning');--> statement-breakpoint
CREATE TABLE "gmail_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"status" "gmail_connection_status" DEFAULT 'connected' NOT NULL,
	"granted_scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text NOT NULL,
	"token_expires_at" timestamp,
	"last_sync_at" timestamp,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"sending_window" jsonb NOT NULL,
	"daily_limit" integer DEFAULT 50 NOT NULL,
	"hourly_limit" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gmail_integrations_workspace_user_email_unique" UNIQUE("workspace_id","user_id","email")
);
--> statement-breakpoint
CREATE TABLE "sequence_activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"sequence_id" uuid,
	"enrollment_id" uuid,
	"person_id" uuid,
	"type" "sequence_activity_type" NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequence_enrollment_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"step_id" uuid,
	"type" "sequence_step_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"position" integer NOT NULL,
	"step_snapshot" jsonb NOT NULL,
	"status" "sequence_enrollment_step_status" DEFAULT 'pending' NOT NULL,
	"due_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp,
	"processed_at" timestamp,
	"last_error" text,
	"gmail_message_id" text,
	"gmail_thread_id" text,
	"created_task_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sequence_enrollment_steps_enrollment_position_unique" UNIQUE("enrollment_id","position")
);
--> statement-breakpoint
CREATE TABLE "sequence_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"sequence_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"gmail_integration_id" uuid,
	"enrolled_by_id" uuid,
	"status" "sequence_enrollment_status" DEFAULT 'active' NOT NULL,
	"current_position" integer DEFAULT 0 NOT NULL,
	"next_step_due_at" timestamp,
	"last_error" text,
	"paused_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequence_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"sequence_id" uuid NOT NULL,
	"type" "sequence_step_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"position" integer NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sequence_steps_sequence_position_unique" UNIQUE("sequence_id","position")
);
--> statement-breakpoint
CREATE TABLE "sequence_suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"reason" varchar(100) DEFAULT 'unsubscribe' NOT NULL,
	"source" varchar(100) DEFAULT 'public_unsubscribe' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sequence_suppressions_workspace_email_unique" UNIQUE("workspace_id","email")
);
--> statement-breakpoint
CREATE TABLE "sequence_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"sequence_id" uuid,
	"enrollment_id" uuid,
	"enrollment_step_id" uuid,
	"person_id" uuid,
	"assigned_to_id" uuid,
	"type" "sequence_task_type" NOT NULL,
	"status" "sequence_task_status" DEFAULT 'open' NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"due_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequence_unsubscribe_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"sequence_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"person_id" uuid,
	"email" varchar(255) NOT NULL,
	"token_hash" text NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sequence_unsubscribe_tokens_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "sequence_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"sequence_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"steps_snapshot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_by_id" uuid,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sequence_versions_sequence_version_unique" UNIQUE("sequence_id","version_number")
);
--> statement-breakpoint
CREATE TABLE "sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"created_by_id" uuid,
	"latest_published_version_id" uuid,
	"name" varchar(255) NOT NULL,
	"status" "sequence_status" DEFAULT 'draft' NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"sending_window" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gmail_integrations" ADD CONSTRAINT "gmail_integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gmail_integrations" ADD CONSTRAINT "gmail_integrations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_activity_events" ADD CONSTRAINT "sequence_activity_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_activity_events" ADD CONSTRAINT "sequence_activity_events_sequence_id_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_activity_events" ADD CONSTRAINT "sequence_activity_events_enrollment_id_sequence_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sequence_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_activity_events" ADD CONSTRAINT "sequence_activity_events_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollment_steps" ADD CONSTRAINT "sequence_enrollment_steps_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollment_steps" ADD CONSTRAINT "sequence_enrollment_steps_enrollment_id_sequence_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sequence_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_sequence_id_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_version_id_sequence_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."sequence_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_gmail_integration_id_gmail_integrations_id_fk" FOREIGN KEY ("gmail_integration_id") REFERENCES "public"."gmail_integrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_enrolled_by_id_user_id_fk" FOREIGN KEY ("enrolled_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_steps" ADD CONSTRAINT "sequence_steps_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_steps" ADD CONSTRAINT "sequence_steps_sequence_id_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_suppressions" ADD CONSTRAINT "sequence_suppressions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_tasks" ADD CONSTRAINT "sequence_tasks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_tasks" ADD CONSTRAINT "sequence_tasks_sequence_id_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_tasks" ADD CONSTRAINT "sequence_tasks_enrollment_id_sequence_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sequence_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_tasks" ADD CONSTRAINT "sequence_tasks_enrollment_step_id_sequence_enrollment_steps_id_fk" FOREIGN KEY ("enrollment_step_id") REFERENCES "public"."sequence_enrollment_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_tasks" ADD CONSTRAINT "sequence_tasks_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_tasks" ADD CONSTRAINT "sequence_tasks_assigned_to_id_user_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_unsubscribe_tokens" ADD CONSTRAINT "sequence_unsubscribe_tokens_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_unsubscribe_tokens" ADD CONSTRAINT "sequence_unsubscribe_tokens_sequence_id_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_unsubscribe_tokens" ADD CONSTRAINT "sequence_unsubscribe_tokens_enrollment_id_sequence_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sequence_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_unsubscribe_tokens" ADD CONSTRAINT "sequence_unsubscribe_tokens_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_versions" ADD CONSTRAINT "sequence_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_versions" ADD CONSTRAINT "sequence_versions_sequence_id_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_versions" ADD CONSTRAINT "sequence_versions_published_by_id_user_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequences" ADD CONSTRAINT "sequences_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequences" ADD CONSTRAINT "sequences_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gmail_integrations_workspace_id_idx" ON "gmail_integrations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "gmail_integrations_user_id_idx" ON "gmail_integrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gmail_integrations_status_idx" ON "gmail_integrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sequence_activity_events_workspace_id_idx" ON "sequence_activity_events" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "sequence_activity_events_sequence_id_idx" ON "sequence_activity_events" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "sequence_activity_events_enrollment_id_idx" ON "sequence_activity_events" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "sequence_activity_events_person_id_idx" ON "sequence_activity_events" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "sequence_activity_events_type_idx" ON "sequence_activity_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "sequence_activity_events_created_at_idx" ON "sequence_activity_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sequence_enrollment_steps_workspace_id_idx" ON "sequence_enrollment_steps" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollment_steps_enrollment_id_idx" ON "sequence_enrollment_steps" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollment_steps_status_due_idx" ON "sequence_enrollment_steps" USING btree ("status","due_at");--> statement-breakpoint
CREATE INDEX "sequence_enrollment_steps_thread_idx" ON "sequence_enrollment_steps" USING btree ("gmail_thread_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollments_workspace_id_idx" ON "sequence_enrollments" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollments_sequence_id_idx" ON "sequence_enrollments" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollments_version_id_idx" ON "sequence_enrollments" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollments_person_id_idx" ON "sequence_enrollments" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollments_gmail_integration_id_idx" ON "sequence_enrollments" USING btree ("gmail_integration_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollments_status_due_idx" ON "sequence_enrollments" USING btree ("status","next_step_due_at");--> statement-breakpoint
CREATE INDEX "sequence_steps_workspace_id_idx" ON "sequence_steps" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "sequence_steps_sequence_id_idx" ON "sequence_steps" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "sequence_suppressions_workspace_id_idx" ON "sequence_suppressions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "sequence_suppressions_email_idx" ON "sequence_suppressions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "sequence_tasks_workspace_id_idx" ON "sequence_tasks" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "sequence_tasks_sequence_id_idx" ON "sequence_tasks" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "sequence_tasks_enrollment_id_idx" ON "sequence_tasks" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "sequence_tasks_enrollment_step_id_idx" ON "sequence_tasks" USING btree ("enrollment_step_id");--> statement-breakpoint
CREATE INDEX "sequence_tasks_person_id_idx" ON "sequence_tasks" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "sequence_tasks_assigned_to_id_idx" ON "sequence_tasks" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "sequence_tasks_status_due_idx" ON "sequence_tasks" USING btree ("status","due_at");--> statement-breakpoint
CREATE INDEX "sequence_unsubscribe_tokens_workspace_id_idx" ON "sequence_unsubscribe_tokens" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "sequence_unsubscribe_tokens_enrollment_id_idx" ON "sequence_unsubscribe_tokens" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "sequence_unsubscribe_tokens_email_idx" ON "sequence_unsubscribe_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "sequence_versions_workspace_id_idx" ON "sequence_versions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "sequence_versions_sequence_id_idx" ON "sequence_versions" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "sequences_workspace_id_idx" ON "sequences" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "sequences_created_by_id_idx" ON "sequences" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "sequences_status_idx" ON "sequences" USING btree ("status");