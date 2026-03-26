import type { Context } from "hono";
import type { CreatePerson, UpdatePerson } from "@workspace/validators";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client.js";
import { people } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/helpers/api-response.js";
import { AppError } from "@/helpers/app-error.js";
import { toDate } from "@/helpers/date.js";
import { getSessionWorkspaceId } from "@/helpers/workspace.js";

export async function listPeople(c: Context) {
  const workspaceId = getSessionWorkspaceId(c);
  const results = await db.select().from(people).where(eq(people.workspaceId, workspaceId));

  return sendSuccess(c, { people: results }, STATUS_CODES.OK);
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
