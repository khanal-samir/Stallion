"use client";

import { useState } from "react";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/ui/sidebar";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import {
  useWorkspaces,
  useActiveWorkspace,
  useSetActiveWorkspace,
  useRestoreActiveWorkspace,
} from "@/hooks/queries/use-workspace";
import { Logo } from "@workspace/ui/components/ui/logo";

export function TeamSwitcher() {
  useRestoreActiveWorkspace();
  const { isMobile } = useSidebar();
  const { data: workspaces, isPending: workspacesLoading } = useWorkspaces();
  const { data: activeWorkspace, isPending: activeLoading } = useActiveWorkspace();
  const { mutate: setActiveWorkspaceMutation } = useSetActiveWorkspace();
  const [createOpen, setCreateOpen] = useState(false);

  const isLoading = workspacesLoading || activeLoading;

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="pointer-events-none">
            <Skeleton className="size-8 rounded-lg" />
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const activeName = activeWorkspace?.name ?? "No workspace";

  function handleSwitch(organizationId: string) {
    if (organizationId === activeWorkspace?.id) return;
    setActiveWorkspaceMutation({ organizationId });
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Logo size="xs" showText={false} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeWorkspace?.slug ?? ""}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>
              {workspaces?.map((ws) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => handleSwitch(ws.id)}
                  className="gap-2 p-2 cursor-pointer"
                >
                  <Logo size="xs" showText={false} />
                  <span className="flex-1 truncate">{ws.name}</span>
                  {ws.id === activeWorkspace?.id && (
                    <Check className="ml-auto size-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() => setCreateOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <span className="font-medium text-muted-foreground">Add workspace</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
