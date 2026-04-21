"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/ui/tooltip";
import { SETTINGS_NAV_ITEMS } from "@/constants/navigation";
import { useWorkspaceInvitations, useWorkspaceMembers } from "@/hooks/queries/use-workspace";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeId = pathname.split("/").pop() ?? "general";
  const activeItem = SETTINGS_NAV_ITEMS.find((item) => item.id === activeId);
  const title = activeItem?.label ?? "Settings";

  const { data: members } = useWorkspaceMembers();
  const { data: invitations } = useWorkspaceInvitations();

  const pendingInvitations =
    invitations?.filter((inv: { status?: string }) => inv.status === "pending") ?? [];

  return (
    <div className="-m-6 flex h-[calc(100vh-3rem)] overflow-hidden">
      <div className="flex w-13 shrink-0 flex-col items-center gap-1 border-r border-border/50 bg-sidebar-background py-3">
        {SETTINGS_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeId === id;
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <Link
                  href={`/settings/${id}`}
                  className={cn(
                    "relative flex size-9 cursor-pointer items-center justify-center transition-all duration-150",
                    isActive
                      ? "text-sidebar-foreground font-medium"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {isActive && (
                    <span className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-primary rounded-full" />
                  )}
                  <span className="sr-only">{label}</span>
                  {id === "invitations" && pendingInvitations.length > 0 && (
                    <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-md bg-primary px-0.5 text-[9px] font-semibold text-primary-foreground shadow-sm">
                      {pendingInvitations.length}
                    </span>
                  )}
                  {id === "members" && (members?.length ?? 0) > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-md bg-secondary px-0.5 text-[9px] font-medium text-secondary-foreground">
                      {members?.length}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center border-b border-border/50 px-6 bg-background">
          <h1 className="text-sm font-semibold">{title}</h1>
        </div>

        <div className="flex-1 overflow-auto p-8">{children}</div>
      </div>
    </div>
  );
}
