"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  Settings,
  CreditCard,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { TeamSwitcher } from "@/components/layout/team-switcher";
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

const mainNav = [
  {
    label: "People",
    href: "/people",
    icon: Users,
  },
  {
    label: "Organizations",
    href: "/organizations",
    icon: Building2,
  },
  {
    label: "Deals",
    href: "/deals",
    icon: Kanban,
  },
];

const workspaceNav = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Billing", href: "/billing", icon: CreditCard },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useAuthSession();
  const signOutMutation = useSignOut();

  const user = session?.user;
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  function handleSignOut() {
    signOutMutation.mutate(undefined, {
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
            {mainNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className={cn(
                      "bg-transparent! border-0",
                      isActive &&
                        "bg-sidebar-accent text-sidebar-accent-foreground rounded-md border-l-2 border-sidebar-primary",
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
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
            {workspaceNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className={cn(
                      "bg-transparent! border-0",
                      isActive &&
                        "bg-sidebar-accent text-sidebar-accent-foreground rounded-md border-l-2 border-sidebar-primary",
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
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
                disabled={signOutMutation.isPending}
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {signOutMutation.isPending ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
