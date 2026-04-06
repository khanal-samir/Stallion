"use client";

import { useState } from "react";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { GeneralSettings } from "@/components/workspace/settings/general-settings";
import { MembersSettings } from "@/components/workspace/settings/members-settings";
import { InvitationsSettings } from "@/components/workspace/settings/invitations-settings";
import {
  SettingsSidebar,
  NAV_ITEMS,
  type SettingsTab,
} from "@/components/workspace/settings/settings-sidebar";
import { useAuthSession } from "@/hooks/queries/use-auth";
import { useActiveWorkspace } from "@/hooks/queries/use-workspace";

export default function SettingsPage() {
  const { data: session } = useAuthSession();
  const { data: workspace, isPending, isError, refetch } = useActiveWorkspace();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

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

  const currentUserId = session?.user?.id;
  const currentMember = workspace.members?.find(
    (member: { userId: string }) => member.userId === currentUserId,
  );
  const currentUserRole = currentMember?.role ?? "member";
  const pendingInvitations = workspace.invitations?.filter((inv) => inv.status === "pending") ?? [];

  const activeItem = NAV_ITEMS.find((item) => item.id === activeTab)!;

  return (
    <div className="-m-6 flex h-[calc(100vh-3rem)] overflow-hidden">
      <SettingsSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        workspace={workspace}
        pendingInvitations={pendingInvitations}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center border-b border-border/50 px-6 bg-background">
          <h1 className="text-sm font-semibold">{activeItem.label}</h1>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {activeTab === "general" && (
            <GeneralSettings
              workspace={{
                id: workspace.id,
                name: workspace.name,
                slug: workspace.slug,
                logo: workspace.logo,
                ownerId: (workspace as Record<string, unknown>).ownerId as string | undefined,
                metadata: workspace.metadata as Record<string, unknown> | undefined,
              }}
            />
          )}
          {activeTab === "members" && (
            <MembersSettings
              members={workspace.members ?? []}
              organizationId={workspace.id}
              ownerId={(workspace as Record<string, unknown>).ownerId as string | undefined}
            />
          )}
          {activeTab === "invitations" && (
            <InvitationsSettings
              invitations={workspace.invitations ?? []}
              organizationId={workspace.id}
              currentUserRole={currentUserRole}
            />
          )}
        </div>
      </div>
    </div>
  );
}
