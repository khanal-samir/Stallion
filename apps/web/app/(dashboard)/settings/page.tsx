"use client";

import { useState } from "react";
import { Mail, Settings2, Users } from "lucide-react";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { GeneralSettings } from "@/components/workspace/settings/general-settings";
import { MembersSettings } from "@/components/workspace/settings/members-settings";
import { InvitationsSettings } from "@/components/workspace/settings/invitations-settings";
import { useActiveWorkspace } from "@/hooks/queries/use-workspace";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "members", label: "Members", icon: Users },
  { id: "invitations", label: "Invitations", icon: Mail },
] as const;

type SettingsTab = (typeof NAV_ITEMS)[number]["id"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: workspace, isPending, isError, refetch } = useActiveWorkspace();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  if (isPending) {
    return (
      <div className="p-6">
        <LoadingState variant="section" />
      </div>
    );
  }

  if (isError || !workspace) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load workspace"
          description="We couldn't load your workspace settings. Please try again."
          onRetry={() => refetch()}
        />
      </div>
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
      <div className="flex w-13 shrink-0 flex-col items-center gap-1 border-r bg-sidebar py-3">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "relative flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors duration-150",
                  activeTab === id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="sr-only">{label}</span>
                {id === "invitations" && pendingInvitations.length > 0 && (
                  <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold text-primary-foreground">
                    {pendingInvitations.length}
                  </span>
                )}
                {id === "members" && (workspace.members?.length ?? 0) > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-muted px-0.5 text-[9px] font-medium text-muted-foreground">
                    {workspace.members?.length}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Content panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Panel header */}
        <div className="flex h-12 shrink-0 items-center border-b px-6">
          <h1 className="text-sm font-medium">{activeItem.label}</h1>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto p-6">
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
