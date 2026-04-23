import type { Context } from "hono";
import type {
  BulkDeleteInput,
  CreateOrg,
  ListOrgsQuery,
  UpdateOrg,
} from "@workspace/validators/schemas/crm";
import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db/client.js";
import { org, people, user } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";
import { AppError } from "@/lib/app-error.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";

export async function listOrgs(c: Context, query: ListOrgsQuery) {
  const workspaceId = getSessionWorkspaceId(c);
  const { page, pageSize, sortOrder, sortBy, search, industry, size, ownerId } = query;

  const conditions = [eq(org.workspaceId, workspaceId)];
  if (industry) conditions.push(eq(org.industry, industry));
  if (size) conditions.push(eq(org.size, size));
  if (ownerId) conditions.push(eq(org.ownerId, ownerId));
  if (search) {
    const searchTerm = `%${search}%`;
    conditions.push(
      or(
        ilike(org.name, searchTerm),
        ilike(org.domain, searchTerm),
        ilike(org.industry, searchTerm),
        ilike(org.size, searchTerm),
        ilike(org.location, searchTerm),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const direction = sortOrder === "desc" ? desc : asc;
  const orderBy = (() => {
    switch (sortBy) {
      case "domain":
        return direction(org.domain);
      case "industry":
        return direction(org.industry);
      case "size":
        return direction(org.size);
      case "location":
        return direction(org.location);
      case "createdAt":
        return direction(org.createdAt);
      case "updatedAt":
        return direction(org.updatedAt);
      case "name":
      default:
        return direction(org.name);
    }
  })();

  const [rows, totalCountResult, peopleCounts] = await Promise.all([
    db
      .select({
        id: org.id,
        workspaceId: org.workspaceId,
        ownerId: org.ownerId,
        name: org.name,
        domain: org.domain,
        industry: org.industry,
        size: org.size,
        location: org.location,
        customFields: org.customFields,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        ownerName: user.name,
      })
      .from(org)
      .leftJoin(user, eq(org.ownerId, user.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ totalCount: count() }).from(org).where(whereClause),
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
      org: rows.map((o) => ({
        ...o,
        peopleCount: peopleCountMap.get(o.id) ?? 0,
      })),
      meta: { page, pageSize, totalCount, totalPages },
    },
    STATUS_CODES.OK,
  );
}

export async function getOrg(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const result = await db.query.org.findFirst({
    where: and(eq(org.id, id), eq(org.workspaceId, workspaceId)),
    with: {
      people: {
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

  if (!result) {
    throw new AppError("Organization not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { org: result }, STATUS_CODES.OK);
}

export async function createOrg(c: Context, payload: CreateOrg) {
  const workspaceId = getSessionWorkspaceId(c);
  const user = c.get("user");
  const [result] = await db
    .insert(org)
    .values({
      ...payload,
      workspaceId,
      ownerId: payload.ownerId ?? user.id,
    })
    .returning();

  return sendSuccess(c, { org: result }, STATUS_CODES.CREATED);
}

export async function updateOrg(c: Context, id: string, payload: UpdateOrg) {
  const workspaceId = getSessionWorkspaceId(c);
  const [result] = await db
    .update(org)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(and(eq(org.id, id), eq(org.workspaceId, workspaceId)))
    .returning();

  if (!result) {
    throw new AppError("Organization not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { org: result }, STATUS_CODES.OK);
}

export async function deleteOrg(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const [result] = await db
    .delete(org)
    .where(and(eq(org.id, id), eq(org.workspaceId, workspaceId)))
    .returning();

  if (!result) {
    throw new AppError("Organization not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { org: result }, STATUS_CODES.OK);
}

export async function bulkDeleteOrgs(c: Context, payload: BulkDeleteInput) {
  const workspaceId = getSessionWorkspaceId(c);
  const deleted = await db
    .delete(org)
    .where(and(eq(org.workspaceId, workspaceId), inArray(org.id, payload.ids)))
    .returning({ id: org.id });

  return sendSuccess(c, { deleted: deleted.length }, STATUS_CODES.OK);
}
