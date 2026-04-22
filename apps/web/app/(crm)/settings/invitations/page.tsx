"use client";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { InvitationsSettings } from "@/components/workspace/settings/invitations-settings";
import { useWorkspaceInvitations } from "@/hooks/queries/use-workspace";

export default function InvitationsSettingsPage() {
  const {
    data: invitations,
    isPending,
    isError,
    refetch,
  } = useWorkspaceInvitations();

  if (isPending) {
    return <LoadingState variant="section" />;
  }

  if (isError || !invitations) {
    return (
      <ErrorState
        title="Failed to load invitations"
        description="We couldn't load workspace invitations. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  return <InvitationsSettings invitations={invitations} />;
}
