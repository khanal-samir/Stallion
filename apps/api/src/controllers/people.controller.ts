import type { Context } from "hono";
import type { CreatePerson, UpdatePerson } from "@workspace/validators";
import { eq } from "drizzle-orm";
import { db } from "@/db/client.js";
import { people } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/helpers/api-response.js";
import { AppError } from "@/helpers/app-error.js";
import { toDate } from "@/helpers/date.js";

export async function listPeople(c: Context) {
  const workspaceId = c.get("session")?.activeOrganizationId;
  if (!workspaceId) {
    throw new AppError("Workspace not found in session", STATUS_CODES.BAD_REQUEST);
  }

  const results = await db.select().from(people).where(eq(people.workspaceId, workspaceId));

  return sendSuccess(c, { people: results }, STATUS_CODES.OK);
}

export async function getPerson(c: Context, id: string) {
  const [person] = await db.select().from(people).where(eq(people.id, id));

  if (!person) {
    throw new AppError("Person not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { person }, STATUS_CODES.OK);
}

export async function createPerson(c: Context, payload: CreatePerson) {
  const [person] = await db
    .insert(people)
    .values({
      ...payload,
      lastContactedAt: toDate(payload.lastContactedAt),
    })
    .returning();

  return sendSuccess(c, { person }, STATUS_CODES.CREATED);
}

export async function updatePerson(c: Context, id: string, payload: UpdatePerson) {
  const [person] = await db
    .update(people)
    .set({
      ...payload,
      lastContactedAt: toDate(payload.lastContactedAt),
      updatedAt: new Date(),
    })
    .where(eq(people.id, id))
    .returning();

  if (!person) {
    throw new AppError("Person not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { person }, STATUS_CODES.OK);
}

export async function deletePerson(c: Context, id: string) {
  const [person] = await db.delete(people).where(eq(people.id, id)).returning();

  if (!person) {
    throw new AppError("Person not found", STATUS_CODES.NOT_FOUND);
  }

  return sendSuccess(c, { person }, STATUS_CODES.OK);
}
