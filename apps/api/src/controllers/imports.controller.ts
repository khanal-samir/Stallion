import type { Context } from "hono";
import type {
  CreateConnectionInput,
  ListImportJobsQuery,
  ListImportRecordsQuery,
  StartImportJobInput,
  UpdateConnectionInput,
  UpdateImportJobInput,
  WebhookIngestInput,
} from "@workspace/validators/schemas/import";
import type { ImportEntityType } from "@workspace/validators/types/import";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";
import { AppError } from "@/lib/app-error.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";
import {
  cancelImportJob,
  commitImportJob,
  createApiKey,
  createConnection,
  deleteConnection,
  getImportJob,
  ingestWebhookRecords,
  listApiKeys,
  listConnections,
  listImportJobs,
  listImportRecords,
  previewSourceFields,
  resolveApiKey,
  revokeApiKey,
  startImportJob,
  updateConnection,
  updateImportJob,
} from "@/services/import.service.js";

export async function listConnectionsController(c: Context) {
  const workspaceId = getSessionWorkspaceId(c);
  const connections = await listConnections(workspaceId);

  return sendSuccess(c, { connections }, STATUS_CODES.OK);
}

export async function createConnectionController(c: Context, payload: CreateConnectionInput) {
  const workspaceId = getSessionWorkspaceId(c);
  const user = c.get("user");
  const connection = await createConnection(workspaceId, user.id, payload);

  return sendSuccess(c, { connection }, STATUS_CODES.CREATED);
}

export async function updateConnectionController(
  c: Context,
  id: string,
  payload: UpdateConnectionInput,
) {
  const workspaceId = getSessionWorkspaceId(c);
  const connection = await updateConnection(workspaceId, id, payload);

  return sendSuccess(c, { connection }, STATUS_CODES.OK);
}

export async function deleteConnectionController(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const connection = await deleteConnection(workspaceId, id);

  return sendSuccess(c, { connection }, STATUS_CODES.OK);
}

export async function previewConnectionFieldsController(
  c: Context,
  id: string,
  entityType: ImportEntityType,
) {
  const workspaceId = getSessionWorkspaceId(c);
  const preview = await previewSourceFields(workspaceId, id, entityType);

  return sendSuccess(c, preview, STATUS_CODES.OK);
}

export async function listApiKeysController(c: Context) {
  const workspaceId = getSessionWorkspaceId(c);
  const apiKeys = await listApiKeys(workspaceId);

  return sendSuccess(c, { apiKeys }, STATUS_CODES.OK);
}

export async function createApiKeyController(c: Context, payload: { name: string }) {
  const workspaceId = getSessionWorkspaceId(c);
  const user = c.get("user");
  const result = await createApiKey(workspaceId, user.id, payload.name);

  return sendSuccess(
    c,
    result,
    STATUS_CODES.CREATED,
    "Store this key now. It cannot be shown again.",
  );
}

export async function revokeApiKeyController(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const apiKey = await revokeApiKey(workspaceId, id);

  return sendSuccess(c, { apiKey }, STATUS_CODES.OK);
}

export async function startImportJobController(c: Context, payload: StartImportJobInput) {
  const workspaceId = getSessionWorkspaceId(c);
  const user = c.get("user");
  const job = await startImportJob(workspaceId, user.id, payload);

  return sendSuccess(c, { job }, STATUS_CODES.CREATED);
}

export async function listImportJobsController(c: Context, query: ListImportJobsQuery) {
  const workspaceId = getSessionWorkspaceId(c);
  const result = await listImportJobs(workspaceId, query);

  return sendSuccess(c, result, STATUS_CODES.OK);
}

export async function getImportJobController(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const job = await getImportJob(workspaceId, id);

  return sendSuccess(c, { job }, STATUS_CODES.OK);
}

export async function listImportRecordsController(
  c: Context,
  id: string,
  query: ListImportRecordsQuery,
) {
  const workspaceId = getSessionWorkspaceId(c);
  const result = await listImportRecords(workspaceId, id, query);

  return sendSuccess(c, result, STATUS_CODES.OK);
}

export async function updateImportJobController(
  c: Context,
  id: string,
  payload: UpdateImportJobInput,
) {
  const workspaceId = getSessionWorkspaceId(c);
  const job = await updateImportJob(workspaceId, id, payload);

  return sendSuccess(c, { job }, STATUS_CODES.OK);
}

export async function commitImportJobController(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const job = await commitImportJob(workspaceId, id);

  return sendSuccess(c, { job }, STATUS_CODES.ACCEPTED);
}

export async function cancelImportJobController(c: Context, id: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const job = await cancelImportJob(workspaceId, id);

  return sendSuccess(c, { job }, STATUS_CODES.OK);
}

/**
 * Unauthenticated by session — this is the endpoint Zapier, Make, n8n, and custom scripts
 * push to, so it authenticates with a workspace API key instead.
 */
export async function ingestWebhookController(c: Context, payload: WebhookIngestInput) {
  const header = c.req.header("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";

  if (token === "") {
    throw new AppError("Missing API key", STATUS_CODES.UNAUTHORIZED);
  }

  const apiKey = await resolveApiKey(token);
  if (!apiKey) {
    throw new AppError("Invalid or revoked API key", STATUS_CODES.UNAUTHORIZED);
  }

  const result = await ingestWebhookRecords(apiKey.workspaceId, payload);

  return sendSuccess(c, result, STATUS_CODES.ACCEPTED);
}
