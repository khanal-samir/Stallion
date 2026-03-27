"use client";

import { Mail, Settings2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const NAV_ITEMS = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "members", label: "Members", icon: Users },
  { id: "invitations", label: "Invitations", icon: Mail },
] as const;

export type SettingsTab = (typeof NAV_ITEMS)[number]["id"];

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  workspace: {
    members?: { userId: string; role: string }[];
  };
  pendingInvitations: { status: string }[];
}

export function SettingsSidebar({
  activeTab,
  onTabChange,
  workspace,
  pendingInvitations,
}: SettingsSidebarProps) {
  return (
    <div className="flex w-13 shrink-0 flex-col items-center gap-1 border-r bg-sidebar py-3">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onTabChange(id)}
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
  );
}
