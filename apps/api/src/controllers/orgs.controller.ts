import type { Context } from "hono";
import type {
  BulkDeleteInput,
  CreateOrg,
  ListOrgsQuery,
  UpdateOrg,
} from "@workspace/validators/schemas/crm";
import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db/client.js";
import { orgs, people } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";
import { AppError } from "@/lib/app-error.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";

export async function listOrgs(c: Context, query: ListOrgsQuery) {
  const workspaceId = getSessionWorkspaceId(c);
  const { page, pageSize, sortOrder, sortBy, search, industry, size } = query;

  const conditions = [eq(orgs.workspaceId, workspaceId)];
  if (industry) conditions.push(eq(orgs.industry, industry));
  if (size) conditions.push(eq(orgs.size, size));
  if (search) {
    const searchTerm = `%${search}%`;
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

  const whereClause = and(...conditions);

  const direction = sortOrder === "desc" ? desc : asc;
  const orderBy = (() => {
    switch (sortBy) {
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
  })();

  const [rows, totalCountResult, peopleCounts] = await Promise.all([
    db
      .select()
      .from(orgs)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ totalCount: count() }).from(orgs).where(whereClause),
    db
      .select({ orgId: people.orgId, count: count() })
      .from(people)
      .where(eq(people.workspaceId, workspaceId))
      .groupBy(people.orgId),
  ]);

  const totalCount = Number(totalCountResult[0]?.totalCount ?? 0);
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
  const peopleCountMap = new Map(peopleCounts.map((r) => [r.orgId, r.count]));

  return sendSuccess(
    c,
    {
      orgs: rows.map((org) => ({ ...org, peopleCount: peopleCountMap.get(org.id) ?? 0 })),
      meta: { page, pageSize, totalCount, totalPages },
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
