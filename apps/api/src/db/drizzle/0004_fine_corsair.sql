CREATE TYPE "public"."crm_custom_field_entity_type" AS ENUM('people', 'orgs');--> statement-breakpoint
CREATE TYPE "public"."crm_custom_field_type" AS ENUM('text', 'number', 'select', 'dateTime');--> statement-breakpoint
CREATE TABLE "crm_custom_field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"entity_type" "crm_custom_field_entity_type" NOT NULL,
	"field_type" "crm_custom_field_type" NOT NULL,
	"label" varchar(255) NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crm_custom_field_definitions_workspace_entity_label_unique" UNIQUE("workspace_id","entity_type","label")
);
--> statement-breakpoint
ALTER TABLE "crm_custom_field_definitions" ADD CONSTRAINT "crm_custom_field_definitions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crm_custom_field_definitions_workspace_entity_idx" ON "crm_custom_field_definitions" USING btree ("workspace_id","entity_type");--> statement-breakpoint
CREATE INDEX "crm_custom_field_definitions_workspace_id_idx" ON "crm_custom_field_definitions" USING btree ("workspace_id");