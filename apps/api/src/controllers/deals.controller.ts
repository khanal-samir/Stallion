import type { Context } from "hono";
import type { CreateDeal, ListDealsQuery, UpdateDeal } from "@workspace/validators/schemas/crm";
import { and, asc, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "@/db/client.js";
import { deals } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";
import { AppError } from "@/lib/app-error.js";
import { toDate } from "@/lib/date.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";

const dealSortColumns = {
  title: deals.title,
  value: deals.value,
  currency: deals.currency,
  stage: deals.stage,
  closeDate: deals.closeDate,
  createdAt: deals.createdAt,
  updatedAt: deals.updatedAt,
} as const;

function buildDealFilters(workspaceId: string, query: ListDealsQuery): SQL[] {
  const filters: SQL[] = [eq(deals.workspaceId, workspaceId)];

  if (query.stage) {
    filters.push(eq(deals.stage, query.stage));
  }

  if (query.ownerId) {
    filters.push(eq(deals.ownerId, query.ownerId));
  }

  if (query.search) {
    const searchTerm = `%${query.search}%`;

    filters.push(ilike(deals.title, searchTerm));
  }

  return filters;
}

function buildDealOrderBy(query: ListDealsQuery) {
  const column = dealSortColumns[query.sortBy] ?? deals.title;
  return query.sortOrder === "desc" ? desc(column) : asc(column);
}

export async function listDeals(c: Context, query: ListDealsQuery) {
  const workspaceId = getSessionWorkspaceId(c);
  const page = query.page;
  const pageSize = query.pageSize;
  const offset = (page - 1) * pageSize;
  const filters = buildDealFilters(workspaceId, query);
  const orderBy = buildDealOrderBy(query);

  const [results, totalCountRows] = await Promise.all([
    db.query.deals.findMany({
      where: and(...filters),
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
      orderBy: [orderBy],
      limit: pageSize,
      offset,
    }),
    db
      .select({
        totalCount: count(deals.id),
      })
      .from(deals)
      .where(and(...filters)),
  ]);

  const totalCount = Number(totalCountRows[0]?.totalCount ?? 0);
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);

  return sendSuccess(
    c,
    {
      deals: results,
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
