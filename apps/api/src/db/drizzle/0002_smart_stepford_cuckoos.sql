ALTER TABLE "workspace_members" DROP CONSTRAINT IF EXISTS "workspace_members_role_check";--> statement-breakpoint
ALTER TABLE "workspace_invites" DROP CONSTRAINT IF EXISTS "workspace_invites_role_check";--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."deal_stage" AS ENUM('new', 'contacted', 'demo', 'proposal', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."people_source" AS ENUM('manual', 'csv', 'api');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."people_status" AS ENUM('lead', 'prospect', 'qualified', 'customer', 'churned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."workspace_invite_role" AS ENUM('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."workspace_invite_status" AS ENUM('pending', 'accepted', 'rejected', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "stage" SET DEFAULT 'new'::"public"."deal_stage";--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "stage" SET DATA TYPE "public"."deal_stage" USING "stage"::"public"."deal_stage";--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "status" SET DEFAULT 'lead'::"public"."people_status";--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "status" SET DATA TYPE "public"."people_status" USING "status"::"public"."people_status";--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "source" SET DEFAULT 'manual'::"public"."people_source";--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "source" SET DATA TYPE "public"."people_source" USING "source"::"public"."people_source";--> statement-breakpoint
ALTER TABLE "workspace_invites" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."workspace_invite_role";--> statement-breakpoint
ALTER TABLE "workspace_invites" ALTER COLUMN "role" SET DATA TYPE "public"."workspace_invite_role" USING "role"::"public"."workspace_invite_role";--> statement-breakpoint
ALTER TABLE "workspace_invites" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."workspace_invite_status";--> statement-breakpoint
ALTER TABLE "workspace_invites" ALTER COLUMN "status" SET DATA TYPE "public"."workspace_invite_status" USING "status"::"public"."workspace_invite_status";--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."workspace_role";--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "role" SET DATA TYPE "public"."workspace_role" USING "role"::"public"."workspace_role";