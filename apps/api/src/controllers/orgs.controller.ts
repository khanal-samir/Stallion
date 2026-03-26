import type { Context } from "hono";
import type { CreateOrg, UpdateOrg } from "@workspace/validators";
import { eq } from "drizzle-orm";
import { db } from "@/db/client.js";
import { orgs } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/helpers/api-response.js";
import { AppError } from "@/helpers/app-error.js";

export async function listOrgs(c: Context) {
  const workspaceId = c.get("session")?.activeOrganizationId;
  if (!workspaceId) {
    throw new AppError("Workspace not found in session", STATUS_CODES.BAD_REQUEST);
  }

  const results = await db.select().from(orgs).where(eq(orgs.workspaceId, workspaceId));

  return sendSuccess(c, { orgs: results }, STATUS_CODES.OK);
}

export async function getOrg(c: Context, id: string) {
  const org = await db.query.orgs.findFirst({
    where: eq(orgs.id, id),
    with: {
      people: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!org) {
    throw new AppError("Organization not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { org }, STATUS_CODES.OK);
}

export async function createOrg(c: Context, payload: CreateOrg) {
  const [org] = await db.insert(orgs).values(payload).returning();

  return sendSuccess(c, { org }, STATUS_CODES.CREATED);
}

export async function updateOrg(c: Context, id: string, payload: UpdateOrg) {
  const [org] = await db
    .update(orgs)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(orgs.id, id))
    .returning();

  if (!org) {
    throw new AppError("Organization not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { org }, STATUS_CODES.OK);
}

export async function deleteOrg(c: Context, id: string) {
  const [org] = await db.delete(orgs).where(eq(orgs.id, id)).returning();

  if (!org) {
    throw new AppError("Organization not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { org }, STATUS_CODES.OK);
}
