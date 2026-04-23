ALTER TABLE "org" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "org" ADD CONSTRAINT "org_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_owner_id_idx" ON "org" USING btree ("owner_id");