import type { Context } from "hono";
import type {
  CreatePerson,
  PeopleListQuery,
  UpdatePerson,
} from "@workspace/validators/schemas/crm";
import { SQL, and, asc, count, desc, eq, ilike, or, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client.js";
import { orgs, people, user } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";
import { AppError } from "@/lib/app-error.js";
import { toDate } from "@/lib/date.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";

// ── Column mapping for sort (SQL fragments) ─────────────────────────────────

const peopleSortMap: Record<string, SQL> = {
  name: sql`${people.name}`,
  email: sql`${people.email}`,
  jobTitle: sql`${people.jobTitle}`,
  status: sql`${people.status}`,
  source: sql`${people.source}`,
  lastContactedAt: sql`${people.lastContactedAt}`,
  createdAt: sql`${people.createdAt}`,
};

export async function listPeople(c: Context, query: PeopleListQuery) {
  const workspaceId = getSessionWorkspaceId(c);
  const { page, limit, sortBy, sortOrder, search, status, source, ownerId } = query;

  const conditions = [eq(people.workspaceId, workspaceId)];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(people.name, pattern),
        ilike(people.email, pattern),
        ilike(people.phone, pattern),
        ilike(people.jobTitle, pattern),
      )!,
    );
  }

  if (status) conditions.push(eq(people.status, status));
  if (source) conditions.push(eq(people.source, source));
  if (ownerId) conditions.push(eq(people.ownerId, ownerId));

  const whereClause = and(...conditions);

  const sortExpr = peopleSortMap[sortBy] ?? peopleSortMap.createdAt!;
  const orderExpr = sortOrder === "asc" ? asc(sortExpr) : desc(sortExpr);

  // Run count and page fetch in parallel — independent queries
  const [countRow, rows] = await Promise.all([
    db.select({ totalCount: count() }).from(people).where(whereClause),
    db
      .select({
        id: people.id,
        workspaceId: people.workspaceId,
        orgId: people.orgId,
        ownerId: people.ownerId,
        name: people.name,
        email: people.email,
        phone: people.phone,
        jobTitle: people.jobTitle,
        linkedinUrl: people.linkedinUrl,
        status: people.status,
        source: people.source,
        lastContactedAt: people.lastContactedAt,
        customFields: people.customFields,
        createdAt: people.createdAt,
        updatedAt: people.updatedAt,
        orgName: orgs.name,
        ownerName: user.name,
      })
      .from(people)
      .leftJoin(orgs, eq(people.orgId, orgs.id))
      .leftJoin(user, eq(people.ownerId, user.id))
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  const totalCount = countRow[0]?.totalCount ?? 0;

  const peopleWithRelations = rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspaceId,
    orgId: row.orgId,
    ownerId: row.ownerId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    jobTitle: row.jobTitle,
    linkedinUrl: row.linkedinUrl,
    status: row.status,
    source: row.source,
    lastContactedAt: row.lastContactedAt,
    customFields: row.customFields,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    org: row.orgId ? { id: row.orgId, name: row.orgName! } : null,
    owner: row.ownerId ? { id: row.ownerId, name: row.ownerName! } : null,
  }));

  const totalPages = Math.ceil(totalCount / limit);

  return sendSuccess(
    c,
    { people: peopleWithRelations, meta: { page, limit, totalCount, totalPages } },
    STATUS_CODES.OK,
  );
}

export async function getPerson(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const [person] = await db
    .select()
    .from(people)
    .where(and(eq(people.id, id), eq(people.workspaceId, workspaceId)));

  if (!person) {
    throw new AppError("Person not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { person }, STATUS_CODES.OK);
}

export async function createPerson(c: Context, payload: CreatePerson) {
  const workspaceId = getSessionWorkspaceId(c);
  const [person] = await db
    .insert(people)
    .values({
      ...payload,
      workspaceId,
      lastContactedAt: toDate(payload.lastContactedAt),
    })
    .returning();

  return sendSuccess(c, { person }, STATUS_CODES.CREATED);
}

export async function updatePerson(c: Context, id: string, payload: UpdatePerson) {
  const workspaceId = getSessionWorkspaceId(c);
  const [person] = await db
    .update(people)
    .set({
      ...payload,
      lastContactedAt: toDate(payload.lastContactedAt),
      updatedAt: new Date(),
    })
    .where(and(eq(people.id, id), eq(people.workspaceId, workspaceId)))
    .returning();

  if (!person) {
    throw new AppError("Person not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { person }, STATUS_CODES.OK);
}

export async function deletePerson(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const [person] = await db
    .delete(people)
    .where(and(eq(people.id, id), eq(people.workspaceId, workspaceId)))
    .returning();

  if (!person) {
    throw new AppError("Person not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { person }, STATUS_CODES.OK);
}

export async function bulkDeletePeople(c: Context, ids: string[]) {
  const workspaceId = getSessionWorkspaceId(c);
  const result = await db
    .delete(people)
    .where(and(eq(people.workspaceId, workspaceId), inArray(people.id, ids)))
    .returning({ id: people.id });

  return sendSuccess(c, { deleted: result.length }, STATUS_CODES.OK);
}
