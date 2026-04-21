import { randomUUID } from "node:crypto";
import type { Context } from "hono";
import { and, eq, ne, sql } from "drizzle-orm";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { db } from "@/db/client.js";
import {
  crmCustomFieldDefinitions,
  orgs,
  people,
  workspaceMembers,
  workspaces,
} from "@/db/schema/index.js";
import { AppError } from "@/lib/app-error.js";
import type { CustomFieldEntityType } from "@workspace/validators/schemas/crm";
import { User } from "better-auth";

type CustomFieldOption = {
  id: string;
  label: string;
};

type SelectOptionsUpdateResult = {
  options: CustomFieldOption[];
  removedOptionIds: string[];
};

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function normalizeOptions(
  options: Array<{ label: string }> | undefined,
): CustomFieldOption[] {
  if (!options || options.length === 0) {
    return [];
  }

  const normalized = options.map((option) => ({
    id: randomUUID(),
    label: option.label.trim(),
  }));

  const normalizedLabels = normalized.map((option) => option.label.toLowerCase());
  if (new Set(normalizedLabels).size !== normalizedLabels.length) {
    throw new AppError(
      "Custom field options must have unique labels",
      STATUS_CODES.UNPROCESSABLE_ENTITY,
    );
  }

  return normalized;
}

export function buildUpdatedSelectOptions(
  existingOptions: CustomFieldOption[],
  incomingOptions: Array<{ label: string }>,
): SelectOptionsUpdateResult {
  const nextLabels = incomingOptions.map((option) => option.label.trim().toLowerCase());

  // set only  keeps unique values
  if (new Set(nextLabels).size !== nextLabels.length) {
    throw new AppError(
      "Custom field options must have unique labels",
      STATUS_CODES.UNPROCESSABLE_ENTITY,
    );
  }

  // index based approach
  //   If user removes middle item:
  // - example old: [A(id1), B(id2), C(id3)]
  // - new labels: [A, C]
  // - index mapping gives [A(id1), C(id2)]
  // - slice(2) removes id3
  // - so C gets wrong id, and wrong option id is considered removed.
  const nextOptions = nextLabels.map((label, index) => ({
    id: existingOptions[index]?.id ?? randomUUID(),
    label,
  }));

  const removedOptionIds = existingOptions.slice(nextOptions.length).map((option) => option.id);

  return {
    options: nextOptions,
    removedOptionIds,
  };
}

export async function assertLabelUnique(
  workspaceId: string,
  entityType: CustomFieldEntityType,
  label: string,
  excludedId?: string,
) {
  const existing = await db.query.crmCustomFieldDefinitions.findFirst({
    where:
      excludedId !== undefined
        ? and(
            eq(crmCustomFieldDefinitions.workspaceId, workspaceId),
            eq(crmCustomFieldDefinitions.entityType, entityType),
            eq(crmCustomFieldDefinitions.label, label),
            ne(crmCustomFieldDefinitions.id, excludedId), // exclude the current record when checking for uniqueness during updates
          )
        : and(
            eq(crmCustomFieldDefinitions.workspaceId, workspaceId),
            eq(crmCustomFieldDefinitions.entityType, entityType),
            eq(crmCustomFieldDefinitions.label, label),
          ),
  });

  if (existing) {
    throw new AppError("A custom field with this label already exists", STATUS_CODES.CONFLICT);
  }
}

// for middleware
export async function assertCanManageCustomFields(c: Context, workspaceId: string) {
  const user = c.get("user") as User | undefined;
  const userId = user?.id;
  if (!userId) {
    throw new AppError("Unauthorized", STATUS_CODES.UNAUTHORIZED);
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
    columns: { ownerId: true },
  });

  if (!workspace) {
    throw new AppError("Workspace not found", STATUS_CODES.NOT_FOUND);
  }

  if (workspace.ownerId === userId) {
    return;
  }

  const membership = await db.query.workspaceMembers.findFirst({
    where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
    columns: { role: true },
  });

  if (membership?.role !== "admin") {
    throw new AppError("Forbidden", STATUS_CODES.FORBIDDEN);
  }
}

export async function clearFieldValues(
  entityType: CustomFieldEntityType,
  workspaceId: string,
  fieldId: string,
  tx?: DbTransaction,
) {
  const client = tx ?? db;
  if (entityType === "people") {
    await client
      .update(people)
      .set({
        // coalese returns the first non-null value, so if customFields is null it will use an empty object casted as jsonb
        // - operator removes the key from the jsonb object, effectively clearing the custom field value
        customFields: sql`coalesce(${people.customFields}, '{}'::jsonb) - ${fieldId}`,
        updatedAt: new Date(),
      })
      .where(and(eq(people.workspaceId, workspaceId), sql`${people.customFields} ? ${fieldId}`)); // boolean check to only update records where the custom field key exists in the jsonb column
    return;
  }

  await client
    .update(orgs)
    .set({
      customFields: sql`coalesce(${orgs.customFields}, '{}'::jsonb) - ${fieldId}`,
      updatedAt: new Date(),
    })
    .where(and(eq(orgs.workspaceId, workspaceId), sql`${orgs.customFields} ? ${fieldId}`));
}

export async function clearOptionValue(
  entityType: CustomFieldEntityType,
  workspaceId: string,
  fieldId: string,
  optionId: string,
  tx?: DbTransaction,
) {
  const client = tx ?? db;
  if (entityType === "people") {
    await client
      .update(people)
      .set({
        customFields: sql`coalesce(${people.customFields}, '{}'::jsonb) - ${fieldId}`,
        updatedAt: new Date(),
      })
      // for select cfid and option id is stored
      .where(
        and(
          eq(people.workspaceId, workspaceId),
          sql`${people.customFields} ->> ${fieldId} = ${optionId}`, // --> access value using key
        ),
      );
    return;
  }

  await client
    .update(orgs)
    .set({
      customFields: sql`coalesce(${orgs.customFields}, '{}'::jsonb) - ${fieldId}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(orgs.workspaceId, workspaceId),
        sql`${orgs.customFields} ->> ${fieldId} = ${optionId}`,
      ),
    );
}
