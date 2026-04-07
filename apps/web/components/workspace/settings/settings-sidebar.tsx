"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/ui/tooltip";
import { SETTINGS_NAV_ITEMS } from "@/constants/navigation";
import type { SettingsSidebarProps } from "@/types/workspace-settings";

export function SettingsSidebar({
  activeTab,
  onTabChange,
  workspace,
  pendingInvitations,
}: SettingsSidebarProps) {
  return (
    <div className="flex w-13 shrink-0 flex-col items-center gap-1 border-r border-border/50 bg-sidebar-background py-3">
      {SETTINGS_NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                "relative flex size-9 cursor-pointer items-center justify-center transition-all duration-150",
                activeTab === id
                  ? "text-sidebar-foreground font-medium"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4" />
              {activeTab === id && (
                <span className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-primary rounded-full" />
              )}
              <span className="sr-only">{label}</span>
              {id === "invitations" && pendingInvitations.length > 0 && (
                <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-md bg-primary px-0.5 text-[9px] font-semibold text-primary-foreground shadow-sm">
                  {pendingInvitations.length}
                </span>
              )}
              {id === "members" && (workspace.members?.length ?? 0) > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-md bg-secondary px-0.5 text-[9px] font-medium text-secondary-foreground">
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
  );
}
