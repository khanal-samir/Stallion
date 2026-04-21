import type { Context, Next } from "hono";
import { assertCanManageCustomFields } from "@/utils/crm-custom-fields.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";

export async function customFieldsAuthMiddleware(c: Context, next: Next) {
  const workspaceId = getSessionWorkspaceId(c);
  await assertCanManageCustomFields(c, workspaceId);
  return next();
}
