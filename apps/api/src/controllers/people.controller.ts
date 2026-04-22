import type { Context } from "hono";
import type {
  BulkDeleteInput,
  CreatePerson,
  ListPeopleQuery,
  UpdatePerson,
} from "@workspace/validators/schemas/crm";
import { and, asc, count, desc, eq, ilike, or, inArray } from "drizzle-orm";
import { db } from "@/db/client.js";
import { org, people, user } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";
import { AppError } from "@/lib/app-error.js";
import { toDate } from "@/lib/date.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";

export async function listPeople(c: Context, query: ListPeopleQuery) {
  const workspaceId = getSessionWorkspaceId(c);
  const { page, pageSize, sortBy, sortOrder, status, source, ownerId, search } = query;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(people.workspaceId, workspaceId)];
  if (status) conditions.push(eq(people.status, status));
  if (source) conditions.push(eq(people.source, source));
  if (ownerId) conditions.push(eq(people.ownerId, ownerId));
  if (search) {
    conditions.push(
      or(
        ilike(people.name, `%${search}%`),
        ilike(people.email, `%${search}%`),
        ilike(people.phone, `%${search}%`),
        ilike(people.jobTitle, `%${search}%`),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const sortColumnMap = {
    name: people.name,
    email: people.email,
    phone: people.phone,
    jobTitle: people.jobTitle,
    status: people.status,
    source: people.source,
    lastContactedAt: people.lastContactedAt,
    createdAt: people.createdAt,
    updatedAt: people.updatedAt,
  } as const;

  const orderColumn = sortColumnMap[sortBy] ?? people.createdAt;
  const orderBy = sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn);

  const [rows, totalCountResult] = await Promise.all([
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
        orgName: org.name,
        ownerName: user.name,
      })
      .from(people)
      .leftJoin(org, eq(people.orgId, org.id))
      .leftJoin(user, eq(people.ownerId, user.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset),
    db.select({ totalCount: count() }).from(people).where(whereClause),
  ]);

  const totalCount = Number(totalCountResult[0]?.totalCount ?? 0);
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);

  return sendSuccess(
    c,
    {
      people: rows.map((row) => ({
        ...row,
        orgName: row.orgName ?? null,
        ownerName: row.ownerName ?? null,
      })),
      meta: { page, pageSize, totalCount, totalPages },
    },
    STATUS_CODES.OK,
  );
}
export async function getPerson(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const person = await db.query.people.findFirst({
    where: and(eq(people.id, id), eq(people.workspaceId, workspaceId)),
    with: {
      org: {
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

export async function bulkDeletePeople(c: Context, payload: BulkDeleteInput) {
  const workspaceId = getSessionWorkspaceId(c);
  const deletedPeople = await db
    .delete(people)
    .where(and(eq(people.workspaceId, workspaceId), inArray(people.id, payload.ids)))
    .returning({ id: people.id });

  return sendSuccess(c, { deleted: deletedPeople.length }, STATUS_CODES.OK);
}
