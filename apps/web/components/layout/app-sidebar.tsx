"use client";

import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import { MAIN_NAV_ITEMS, WORKSPACE_NAV_ITEMS } from "@/constants/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/ui/avatar";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@workspace/ui/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/ui/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import { useAuthSession, useSignOut } from "@/hooks/queries/use-auth";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useAuthSession();
  const { mutate: signOutMutation, isPending: isSignOutPending } = useSignOut();

  const user = session?.user;
  const userInitials = getInitials(user?.name ?? user?.email ?? "U");

  function handleSignOut() {
    signOutMutation(undefined, {
      onSuccess: () => router.push("/login"),
    });
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header */}
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-2">
        {/* Main Group */}
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {MAIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className={cn("relative", isActive && "text-sidebar-foreground font-medium")}
                  >
                    <Link href={item.href} className="relative">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {WORKSPACE_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className={cn("relative", isActive && "text-sidebar-foreground font-medium")}
                  >
                    <Link href={item.href} className="relative">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-3 py-3">
        {sessionPending ? (
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 w-full rounded-md p-2 hover:bg-sidebar-accent transition-colors cursor-pointer">
                <Avatar className="size-8">
                  {user?.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
                  <AvatarFallback className="text-xs bg-sidebar-accent">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.name ?? "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top">
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                disabled={isSignOutPending}
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isSignOutPending ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
