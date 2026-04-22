"use client";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { MembersSettings } from "@/components/workspace/settings/members-settings";
import { useActiveWorkspace, useWorkspaceMembers } from "@/hooks/queries/use-workspace";

export default function MembersSettingsPage() {
  const {
    data: members,
    isPending: isMembersPending,
    isError: isMembersError,
    refetch: refetchMembers,
  } = useWorkspaceMembers();

  const {
    data: workspace,
    isPending: isWorkspacePending,
    isError: isWorkspaceError,
    refetch: refetchWorkspace,
  } = useActiveWorkspace();

  const isPending = isMembersPending || isWorkspacePending;
  const isError = isMembersError || isWorkspaceError;

  if (isPending) {
    return <LoadingState variant="section" />;
  }

  if (isError || !members || !workspace) {
    return (
      <ErrorState
        title="Failed to load members"
        description="We couldn't load workspace members. Please try again."
        onRetry={() => {
          refetchMembers();
          refetchWorkspace();
        }}
      />
    );
  }

  return (
    <MembersSettings
      members={members}
      ownerId={(workspace as Record<string, unknown>).ownerId as string | undefined}
    />
  );
}
