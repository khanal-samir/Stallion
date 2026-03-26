import type { Context } from "hono";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { AppError } from "@/lib/app-error.js";

export function getSessionWorkspaceId(c: Context) {
  const workspaceId = c.get("session")?.activeOrganizationId;
  if (!workspaceId) {
    throw new AppError("Workspace not found in session", STATUS_CODES.BAD_REQUEST);
  }

  return workspaceId;
}
