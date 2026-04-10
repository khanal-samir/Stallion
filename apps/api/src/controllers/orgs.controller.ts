import type { Context } from "hono";
import type {
  BulkDeleteInput,
  CreateOrg,
  ListOrgsQuery,
  UpdateOrg,
} from "@workspace/validators/schemas/crm";
import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db/client.js";
import { orgs } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";
import { AppError } from "@/lib/app-error.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";

function buildOrgWhereClause(workspaceId: string, query: ListOrgsQuery) {
  const conditions = [eq(orgs.workspaceId, workspaceId)];

  if (query.industry) {
    conditions.push(eq(orgs.industry, query.industry));
  }

  if (query.size) {
    conditions.push(eq(orgs.size, query.size));
  }

  if (query.search) {
    const searchTerm = `%${query.search}%`;
    conditions.push(
      or(
        ilike(orgs.name, searchTerm),
        ilike(orgs.domain, searchTerm),
        ilike(orgs.industry, searchTerm),
        ilike(orgs.size, searchTerm),
        ilike(orgs.location, searchTerm),
      )!,
    );
  }

  return and(...conditions);
}

function getOrgOrderBy(query: ListOrgsQuery) {
  const direction = query.sortOrder === "desc" ? desc : asc;

  switch (query.sortBy) {
    case "domain":
      return direction(orgs.domain);
    case "industry":
      return direction(orgs.industry);
    case "size":
      return direction(orgs.size);
    case "location":
      return direction(orgs.location);
    case "createdAt":
      return direction(orgs.createdAt);
    case "updatedAt":
      return direction(orgs.updatedAt);
    case "name":
    default:
      return direction(orgs.name);
  }
}

export async function listOrgs(c: Context, query: ListOrgsQuery) {
  const workspaceId = getSessionWorkspaceId(c);
  const whereClause = buildOrgWhereClause(workspaceId, query);
  const page = query.page;
  const pageSize = query.pageSize;
  const offset = (page - 1) * pageSize;

  const [results, totalCountResult] = await Promise.all([
    db.query.orgs.findMany({
      where: whereClause,
      with: {
        people: {
          columns: {
            id: true,
          },
        },
      },
      orderBy: [getOrgOrderBy(query)],
      limit: pageSize,
      offset,
    }),
    db.select({ totalCount: count() }).from(orgs).where(whereClause),
  ]);

  const totalCount = Number(totalCountResult[0]?.totalCount ?? 0);
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);

  const normalizedResults = results.map(({ people, ...org }) => ({
    ...org,
    peopleCount: people.length,
  }));

  return sendSuccess(
    c,
    {
      orgs: normalizedResults,
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

export async function getOrg(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const org = await db.query.orgs.findFirst({
    where: and(eq(orgs.id, id), eq(orgs.workspaceId, workspaceId)),
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
  const workspaceId = getSessionWorkspaceId(c);
  const [org] = await db
    .insert(orgs)
    .values({
      ...payload,
      workspaceId,
    })
    .returning();

  return sendSuccess(c, { org }, STATUS_CODES.CREATED);
}

export async function updateOrg(c: Context, id: string, payload: UpdateOrg) {
  const workspaceId = getSessionWorkspaceId(c);
  const [org] = await db
    .update(orgs)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(and(eq(orgs.id, id), eq(orgs.workspaceId, workspaceId)))
    .returning();

  if (!org) {
    throw new AppError("Organization not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { org }, STATUS_CODES.OK);
}

export async function deleteOrg(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const [org] = await db
    .delete(orgs)
    .where(and(eq(orgs.id, id), eq(orgs.workspaceId, workspaceId)))
    .returning();

  if (!org) {
    throw new AppError("Organization not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { org }, STATUS_CODES.OK);
}

export async function bulkDeleteOrgs(c: Context, payload: BulkDeleteInput) {
  const workspaceId = getSessionWorkspaceId(c);
  const deletedOrgs = await db
    .delete(orgs)
    .where(and(eq(orgs.workspaceId, workspaceId), inArray(orgs.id, payload.ids)))
    .returning({ id: orgs.id });

  return sendSuccess(c, { deleted: deletedOrgs.length }, STATUS_CODES.OK);
}
