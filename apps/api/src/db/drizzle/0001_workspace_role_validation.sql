UPDATE "workspace_members"
SET "role" = 'member'
WHERE "role" IS NULL
   OR "role" NOT IN ('owner', 'admin', 'member');

UPDATE "workspace_invites"
SET "role" = 'member'
WHERE "role" IS NULL
   OR "role" NOT IN ('admin', 'member');

INSERT INTO "workspace_members" ("workspace_id", "user_id", "role", "joined_at")
SELECT w."id", w."owner_id", 'owner', NOW()
FROM "workspaces" w
LEFT JOIN "workspace_members" wm
  ON wm."workspace_id" = w."id"
 AND wm."user_id" = w."owner_id"
WHERE wm."id" IS NULL;

UPDATE "workspace_members" wm
SET "role" = 'owner'
FROM "workspaces" w
WHERE wm."workspace_id" = w."id"
  AND wm."user_id" = w."owner_id"
  AND wm."role" <> 'owner';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workspace_members_role_check'
  ) THEN
    ALTER TABLE "workspace_members"
      ADD CONSTRAINT "workspace_members_role_check"
      CHECK ("role" IN ('owner', 'admin', 'member'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workspace_invites_role_check'
  ) THEN
    ALTER TABLE "workspace_invites"
      ADD CONSTRAINT "workspace_invites_role_check"
      CHECK ("role" IN ('admin', 'member'));
  END IF;
END $$;
