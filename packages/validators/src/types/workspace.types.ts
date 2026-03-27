import type { WorkspaceRole } from "../schemas/common.validator.js";

export type { WorkspaceRole } from "../schemas/common.validator.js";

export interface InviteMemberInput {
  email: string;
  role: WorkspaceRole;
  organizationId?: string;
  resend?: boolean;
}
