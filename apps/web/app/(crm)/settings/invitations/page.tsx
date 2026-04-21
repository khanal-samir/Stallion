"use client";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { InvitationsSettings } from "@/components/workspace/settings/invitations-settings";
import { useActiveWorkspace, useWorkspaceInvitations } from "@/hooks/queries/use-workspace";

export default function InvitationsSettingsPage() {
  const {
    data: invitations,
    isPending: isInvitationsPending,
    isError: isInvitationsError,
    refetch: refetchInvitations,
  } = useWorkspaceInvitations();

  const {
    data: workspace,
    isPending: isWorkspacePending,
    isError: isWorkspaceError,
    refetch: refetchWorkspace,
  } = useActiveWorkspace();

  const isPending = isInvitationsPending || isWorkspacePending;
  const isError = isInvitationsError || isWorkspaceError;

  if (isPending) {
    return <LoadingState variant="section" />;
  }

  if (isError || !invitations || !workspace) {
    return (
      <ErrorState
        title="Failed to load invitations"
        description="We couldn't load workspace invitations. Please try again."
        onRetry={() => {
          refetchInvitations();
          refetchWorkspace();
        }}
      />
    );
  }

  return <InvitationsSettings invitations={invitations} organizationId={workspace.id} />;
}
