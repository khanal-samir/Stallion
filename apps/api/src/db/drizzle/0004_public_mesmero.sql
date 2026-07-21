CREATE TYPE "public"."import_connection_status" AS ENUM('connected', 'reconnect_required', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."import_entity_type" AS ENUM('person', 'org');--> statement-breakpoint
CREATE TYPE "public"."import_job_status" AS ENUM('pending', 'extracting', 'ready_for_review', 'loading', 'completed', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."import_match_reason" AS ENUM('external_identity', 'email', 'domain', 'name', 'none');--> statement-breakpoint
CREATE TYPE "public"."import_provider" AS ENUM('csv', 'webhook', 'gmail', 'google_calendar', 'calendly', 'google_sheets', 'posthog', 'outlook');--> statement-breakpoint
CREATE TYPE "public"."import_record_status" AS ENUM('pending', 'valid', 'invalid', 'loaded', 'skipped', 'duplicate');--> statement-breakpoint
ALTER TYPE "public"."people_source" ADD VALUE 'import';--> statement-breakpoint
CREATE TABLE "external_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"provider" "import_provider" NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"entity_type" "import_entity_type" NOT NULL,
	"person_id" uuid,
	"org_id" uuid,
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "external_identities_workspace_provider_external_unique" UNIQUE("workspace_id","provider","external_id")
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"connection_id" uuid,
	"created_by_id" uuid,
	"provider" "import_provider" NOT NULL,
	"entity_type" "import_entity_type" DEFAULT 'person' NOT NULL,
	"status" "import_job_status" DEFAULT 'pending' NOT NULL,
	"mapping" jsonb DEFAULT '{"fields":[]}'::jsonb NOT NULL,
	"options" jsonb NOT NULL,
	"source_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"stats" jsonb NOT NULL,
	"cursor" jsonb,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"external_id" varchar(255),
	"row_number" integer NOT NULL,
	"raw" jsonb NOT NULL,
	"normalized" jsonb,
	"status" "import_record_status" DEFAULT 'pending' NOT NULL,
	"match_reason" "import_match_reason" DEFAULT 'none' NOT NULL,
	"match_person_id" uuid,
	"match_org_id" uuid,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "import_records_job_row_unique" UNIQUE("job_id","row_number")
);
--> statement-breakpoint
CREATE TABLE "integration_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"created_by_id" uuid,
	"name" varchar(255) NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"token_prefix" varchar(16) NOT NULL,
	"last_used_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integration_api_keys_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "integration_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "import_provider" NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"external_account_id" varchar(255),
	"status" "import_connection_status" DEFAULT 'connected' NOT NULL,
	"granted_scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cursor" jsonb,
	"last_sync_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integration_connections_workspace_provider_account_unique" UNIQUE("workspace_id","provider","external_account_id")
);
--> statement-breakpoint
ALTER TABLE "external_identities" ADD CONSTRAINT "external_identities_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_identities" ADD CONSTRAINT "external_identities_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_identities" ADD CONSTRAINT "external_identities_org_id_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_connection_id_integration_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."integration_connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_records" ADD CONSTRAINT "import_records_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_records" ADD CONSTRAINT "import_records_job_id_import_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_records" ADD CONSTRAINT "import_records_match_person_id_people_id_fk" FOREIGN KEY ("match_person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_records" ADD CONSTRAINT "import_records_match_org_id_org_id_fk" FOREIGN KEY ("match_org_id") REFERENCES "public"."org"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_api_keys" ADD CONSTRAINT "integration_api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_api_keys" ADD CONSTRAINT "integration_api_keys_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "external_identities_workspace_id_idx" ON "external_identities" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "external_identities_person_id_idx" ON "external_identities" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "external_identities_org_id_idx" ON "external_identities" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "import_jobs_workspace_id_idx" ON "import_jobs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "import_jobs_connection_id_idx" ON "import_jobs" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "import_jobs_status_next_attempt_idx" ON "import_jobs" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "import_jobs_provider_idx" ON "import_jobs" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "import_records_workspace_id_idx" ON "import_records" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "import_records_job_status_idx" ON "import_records" USING btree ("job_id","status");--> statement-breakpoint
CREATE INDEX "import_records_external_id_idx" ON "import_records" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "integration_api_keys_workspace_id_idx" ON "integration_api_keys" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "integration_connections_workspace_id_idx" ON "integration_connections" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "integration_connections_user_id_idx" ON "integration_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "integration_connections_provider_idx" ON "integration_connections" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "integration_connections_status_idx" ON "integration_connections" USING btree ("status");