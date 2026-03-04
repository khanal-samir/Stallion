import type { Context } from "hono";
import type { CreateDeal, UpdateDeal } from "@workspace/validators";
import { eq } from "drizzle-orm";
import { db } from "@/db/client.js";
import { deals } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/helpers/api-response.js";
import { AppError } from "@/helpers/app-error.js";
import { toDate } from "@/helpers/date.js";

export async function listDeals(c: Context) {
  const results = await db.select().from(deals);

  return sendSuccess(c, { deals: results }, STATUS_CODES.OK);
}

export async function getDeal(c: Context, id: string) {
  const deal = await db.query.deals.findFirst({
    where: eq(deals.id, id),
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
  const [deal] = await db
    .insert(deals)
    .values({
      ...payload,
      closeDate: toDate(payload.closeDate),
    })
    .returning();

  return sendSuccess(c, { deal }, STATUS_CODES.CREATED);
}

export async function updateDeal(c: Context, id: string, payload: UpdateDeal) {
  const [deal] = await db
    .update(deals)
    .set({
      ...payload,
      closeDate: toDate(payload.closeDate),
      updatedAt: new Date(),
    })
    .where(eq(deals.id, id))
    .returning();

  if (!deal) {
    throw new AppError("Deal not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { deal }, STATUS_CODES.OK);
}

export async function deleteDeal(c: Context, id: string) {
  const [deal] = await db.delete(deals).where(eq(deals.id, id)).returning();
  if (!deal) {
    throw new AppError("Deal not found", STATUS_CODES.NOT_FOUND);
  }
  return sendSuccess(c, { deal }, STATUS_CODES.OK);
}
