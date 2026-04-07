import type { WorkspaceRole } from "@workspace/validators/types/workspace";
import type { SettingsTab } from "@/constants/navigation";

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export interface WorkspaceInvitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: string;
  expiresAt: string | Date;
  inviter?: {
    user: {
      name: string;
      email: string;
    };
  };
}

export interface MembersSettingsProps {
  members: WorkspaceMember[];
  organizationId: string;
  ownerId?: string;
}

export interface InvitationsSettingsProps {
  invitations: WorkspaceInvitation[];
  organizationId: string;
  currentUserRole?: WorkspaceRole;
}

export interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  workspace: {
    members?: Pick<WorkspaceMember, "userId" | "role">[];
  };
  pendingInvitations: Pick<WorkspaceInvitation, "status">[];
}
