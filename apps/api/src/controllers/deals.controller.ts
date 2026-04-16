import type { Context } from "hono";
import type { CreateDeal, ListDealsQuery, UpdateDeal } from "@workspace/validators/schemas/crm";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db/client.js";
import { deals, orgs, people, user } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";
import { AppError } from "@/lib/app-error.js";
import { toDate } from "@/lib/date.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";

export async function listDeals(c: Context, query: ListDealsQuery) {
  const workspaceId = getSessionWorkspaceId(c);
  const { page, pageSize, sortBy, sortOrder, stage, ownerId, search } = query;
  const offset = (page - 1) * pageSize;
  const conditions = [eq(deals.workspaceId, workspaceId)];

  if (stage) conditions.push(eq(deals.stage, stage));
  if (ownerId) conditions.push(eq(deals.ownerId, ownerId));
  if (search) {
    conditions.push(or(ilike(deals.title, `%${search}%`))!);
  }

  const whereClause = and(...conditions);

  const orderBy = (() => {
    switch (sortBy) {
      case "value":
        return sortOrder === "desc" ? desc(deals.value) : asc(deals.value);
      case "currency":
        return sortOrder === "desc" ? desc(deals.currency) : asc(deals.currency);
      case "stage":
        return sortOrder === "desc" ? desc(deals.stage) : asc(deals.stage);
      case "closeDate":
        return sortOrder === "desc" ? desc(deals.closeDate) : asc(deals.closeDate);
      case "createdAt":
        return sortOrder === "desc" ? desc(deals.createdAt) : asc(deals.createdAt);
      case "updatedAt":
        return sortOrder === "desc" ? desc(deals.updatedAt) : asc(deals.updatedAt);
      case "title":
      default:
        return sortOrder === "desc" ? desc(deals.title) : asc(deals.title);
    }
  })();

  const [results, totalCountRows] = await Promise.all([
    db
      .select({
        id: deals.id,
        workspaceId: deals.workspaceId,
        orgId: deals.orgId,
        personId: deals.personId,
        ownerId: deals.ownerId,
        title: deals.title,
        value: deals.value,
        currency: deals.currency,
        stage: deals.stage,
        closeDate: deals.closeDate,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt,
        orgName: orgs.name,
        personName: people.name,
        ownerName: user.name,
      })
      .from(deals)
      .leftJoin(orgs, eq(deals.orgId, orgs.id))
      .leftJoin(people, eq(deals.personId, people.id))
      .leftJoin(user, eq(deals.ownerId, user.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset),
    db.select({ totalCount: count() }).from(deals).where(whereClause),
  ]);

  const totalCount = Number(totalCountRows[0]?.totalCount ?? 0);
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);

  return sendSuccess(
    c,
    {
      deals: results.map((deal) => ({
        ...deal,
        orgName: deal.orgName ?? null,
        personName: deal.personName ?? null,
        ownerName: deal.ownerName ?? null,
      })),
      meta: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    },
    STATUS_CODES.OK,
  );
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
      owner: {
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
