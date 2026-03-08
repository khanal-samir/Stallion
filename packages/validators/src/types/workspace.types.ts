import { WorkspaceRole } from "../index.js";

export interface InviteMemberInput {
  email: string;
  role: WorkspaceRole;
  organizationId?: string;
  resend?: boolean;
}
