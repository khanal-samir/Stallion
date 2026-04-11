import type { Context } from "hono";
import type { CreateOrg, OrgsListQuery, UpdateOrg } from "@workspace/validators/schemas/crm";
import { SQL, and, asc, count, desc, eq, ilike, or, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client.js";
import { orgs, people } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";
import { AppError } from "@/lib/app-error.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";

const orgsSortMap: Record<string, SQL> = {
  name: sql`${orgs.name}`,
  domain: sql`${orgs.domain}`,
  industry: sql`${orgs.industry}`,
  size: sql`${orgs.size}`,
  location: sql`${orgs.location}`,
  createdAt: sql`${orgs.createdAt}`,
};

export async function listOrgs(c: Context, query: OrgsListQuery) {
  const workspaceId = getSessionWorkspaceId(c);
  const { page, limit, sortBy, sortOrder, search, industry, size } = query;

  const conditions = [eq(orgs.workspaceId, workspaceId)];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(orgs.name, pattern),
        ilike(orgs.domain, pattern),
        ilike(orgs.industry, pattern),
        ilike(orgs.location, pattern),
      )!,
    );
  }

  if (industry) conditions.push(eq(orgs.industry, industry));
  if (size) conditions.push(eq(orgs.size, size));

  const whereClause = and(...conditions);

  const sortExpr = orgsSortMap[sortBy] ?? orgsSortMap.createdAt!;
  const orderExpr = sortOrder === "asc" ? asc(sortExpr) : desc(sortExpr);

  // Run count and page fetch in parallel — independent queries
  const [countRow, rows] = await Promise.all([
    db.select({ totalCount: count() }).from(orgs).where(whereClause),
    db
      .select()
      .from(orgs)
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  const totalCount = countRow[0]?.totalCount ?? 0;

  // Must wait for rows before fetching people counts
  const orgIds = rows.map((row) => row.id); // ["org1", "org2", ...]
  const peopleCounts =
    orgIds.length > 0 // Conditional to avoid unnecessary query when no orgs are returned
      ? await db
          .select({ orgId: people.orgId, count: count() })
          .from(people)
          .where(and(eq(people.workspaceId, workspaceId), inArray(people.orgId, orgIds)))
          .groupBy(people.orgId)
      : []; // [{ orgId: "org1", count: 5 }, { orgId: "org2", count: 10 }, ...]

  // map hashes array needs to get searched so map it to an object for O(1) lookup instead of O(n)
  const peopleCountMap = new Map(peopleCounts.map((r) => [r.orgId, r.count])); // { "org1": 5, "org2": 10, ... }

  const orgsWithCount = rows.map((org) => ({
    ...org,
    peopleCount: peopleCountMap.get(org.id) ?? 0,
  }));

  const totalPages = Math.ceil(totalCount / limit);

  return sendSuccess(
    c,
    { orgs: orgsWithCount, meta: { page, limit, totalCount, totalPages } },
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

export async function bulkDeleteOrgs(c: Context, ids: string[]) {
  const workspaceId = getSessionWorkspaceId(c);
  const result = await db
    .delete(orgs)
    .where(and(eq(orgs.workspaceId, workspaceId), inArray(orgs.id, ids)))
    .returning({ id: orgs.id });

  return sendSuccess(c, { deleted: result.length }, STATUS_CODES.OK);
}
