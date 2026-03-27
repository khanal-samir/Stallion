import type { Context } from "hono";
import type { CreateDeal, UpdateDeal } from "@workspace/validators/schemas/crm";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client.js";
import { deals } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";
import { AppError } from "@/lib/app-error.js";
import { toDate } from "@/lib/date.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";

export async function listDeals(c: Context) {
  const workspaceId = getSessionWorkspaceId(c);
  const results = await db.select().from(deals).where(eq(deals.workspaceId, workspaceId));

  return sendSuccess(c, { deals: results }, STATUS_CODES.OK);
}

export async function getDeal(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const deal = await db.query.deals.findFirst({
    where: and(eq(deals.id, id), eq(deals.workspaceId, workspaceId)),
    with: {
      org: {
        columns: {
          id: true,
          name: true,
        },
      },
      person: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });
  if (!deal) {
    throw new AppError("Deal not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { deal }, STATUS_CODES.OK);
}

export async function createDeal(c: Context, payload: CreateDeal) {
  const workspaceId = getSessionWorkspaceId(c);
  const [deal] = await db
    .insert(deals)
    .values({
      ...payload,
      workspaceId,
      closeDate: toDate(payload.closeDate),
    })
    .returning();

  return sendSuccess(c, { deal }, STATUS_CODES.CREATED);
}

export async function updateDeal(c: Context, id: string, payload: UpdateDeal) {
  const workspaceId = getSessionWorkspaceId(c);
  const [deal] = await db
    .update(deals)
    .set({
      ...payload,
      closeDate: toDate(payload.closeDate),
      updatedAt: new Date(),
    })
    .where(and(eq(deals.id, id), eq(deals.workspaceId, workspaceId)))
    .returning();

  if (!deal) {
    throw new AppError("Deal not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { deal }, STATUS_CODES.OK);
}

export async function deleteDeal(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const [deal] = await db
    .delete(deals)
    .where(and(eq(deals.id, id), eq(deals.workspaceId, workspaceId)))
    .returning();
  if (!deal) {
    throw new AppError("Deal not found", STATUS_CODES.NOT_FOUND);
  }
  return sendSuccess(c, { deal }, STATUS_CODES.OK);
}
