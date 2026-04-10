import type { AssignableWorkspaceRole } from "../schemas/common.validator.js";
export type { AssignableWorkspaceRole, WorkspaceRole } from "../schemas/common.validator.js";

export interface InviteMemberInput {
  email: string;
  role: AssignableWorkspaceRole;
  organizationId?: string;
  resend?: boolean;
}
