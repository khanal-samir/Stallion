"use client";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { GeneralSettings } from "@/components/workspace/settings/general-settings";
import { useActiveWorkspace } from "@/hooks/queries/use-workspace";

export default function GeneralSettingsPage() {
  const { data: workspace, isPending, isError, refetch } = useActiveWorkspace();

  if (isPending) {
    return <LoadingState variant="section" />;
  }

  if (isError || !workspace) {
    return (
      <ErrorState
        title="Failed to load workspace"
        description="We couldn't load your workspace settings. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <GeneralSettings
      workspace={{
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        logo: workspace.logo ?? undefined,
        ownerId: (workspace as Record<string, unknown>).ownerId as string | undefined,
      }}
    />
  );
}
