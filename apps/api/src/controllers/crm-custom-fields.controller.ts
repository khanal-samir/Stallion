import type { Context } from "hono";
import type {
  CreateCustomFieldDefinitionInput,
  CustomFieldEntityType,
  UpdateCustomFieldDefinitionInput,
} from "@workspace/validators/schemas/crm";
import { and, asc, eq } from "drizzle-orm";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { db } from "@/db/client.js";
import { crmCustomFieldDefinitions } from "@/db/schema/index.js";
import { sendSuccess } from "@/lib/api-response.js";
import { AppError } from "@/lib/app-error.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";
import {
  assertLabelUnique,
  buildUpdatedSelectOptions,
  clearFieldValues,
  clearOptionValue,
  normalizeOptions,
} from "@/utils/crm-custom-fields.js";

export async function listCustomFieldDefinitions(c: Context, entityType: CustomFieldEntityType) {
  const workspaceId = getSessionWorkspaceId(c);

  const customFields = await db
    .select()
    .from(crmCustomFieldDefinitions)
    .where(
      and(
        eq(crmCustomFieldDefinitions.workspaceId, workspaceId),
        eq(crmCustomFieldDefinitions.entityType, entityType),
      ),
    )
    .orderBy(asc(crmCustomFieldDefinitions.createdAt));

  return sendSuccess(c, { customFields }, STATUS_CODES.OK);
}

export async function createCustomFieldDefinition(
  c: Context,
  entityType: CustomFieldEntityType,
  payload: CreateCustomFieldDefinitionInput,
) {
  const workspaceId = getSessionWorkspaceId(c);

  const label = payload.label.trim();
  await assertLabelUnique(workspaceId, entityType, label);

  const options = payload.type === "select" ? normalizeOptions(payload.options) : [];

  const [customField] = await db
    .insert(crmCustomFieldDefinitions)
    .values({
      workspaceId,
      entityType,
      label,
      fieldType: payload.type,
      options,
    })
    .returning();

  return sendSuccess(c, { customField }, STATUS_CODES.CREATED);
}

export async function updateCustomFieldDefinition(
  c: Context,
  entityType: CustomFieldEntityType,
  id: string,
  payload: UpdateCustomFieldDefinitionInput,
) {
  const workspaceId = getSessionWorkspaceId(c);

  const existing = await db.query.crmCustomFieldDefinitions.findFirst({
    where: and(
      eq(crmCustomFieldDefinitions.id, id),
      eq(crmCustomFieldDefinitions.workspaceId, workspaceId),
      eq(crmCustomFieldDefinitions.entityType, entityType),
    ),
  });

  if (!existing) {
    throw new AppError("Custom field definition not found", STATUS_CODES.NOT_FOUND);
  }

  const updates: {
    label?: string;
    options?: { id: string; label: string }[];
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (payload.label !== undefined) {
    const label = payload.label.trim();
    await assertLabelUnique(workspaceId, entityType, label, id);
    updates.label = label;
  }

  let removedOptionIds: string[] = [];
  if (payload.options !== undefined) {
    if (existing.fieldType !== "select") {
      throw new AppError(
        "Only select custom fields can update options",
        STATUS_CODES.UNPROCESSABLE_ENTITY,
      );
    }

    const selectOptionsResult = buildUpdatedSelectOptions(existing.options ?? [], payload.options);
    removedOptionIds = selectOptionsResult.removedOptionIds;
    updates.options = selectOptionsResult.options;
  }

  const customField = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(crmCustomFieldDefinitions)
      .set(updates)
      .where(
        and(
          eq(crmCustomFieldDefinitions.id, id),
          eq(crmCustomFieldDefinitions.workspaceId, workspaceId),
          eq(crmCustomFieldDefinitions.entityType, entityType),
        ),
      )
      .returning();

    for (const optionId of removedOptionIds) {
      await clearOptionValue(entityType, workspaceId, id, optionId, tx);
    }

    return updated;
  });

  return sendSuccess(c, { customField }, STATUS_CODES.OK);
}

export async function deleteCustomFieldDefinition(
  c: Context,
  entityType: CustomFieldEntityType,
  id: string,
) {
  const workspaceId = getSessionWorkspaceId(c);

  const customField = await db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(crmCustomFieldDefinitions)
      .where(
        and(
          eq(crmCustomFieldDefinitions.id, id),
          eq(crmCustomFieldDefinitions.workspaceId, workspaceId),
          eq(crmCustomFieldDefinitions.entityType, entityType),
        ),
      )
      .returning();

    if (!deleted) {
      throw new AppError("Custom field definition not found", STATUS_CODES.NOT_FOUND);
    }

    await clearFieldValues(entityType, workspaceId, id, tx);

    return deleted;
  });

  return sendSuccess(c, { customField }, STATUS_CODES.OK);
}
