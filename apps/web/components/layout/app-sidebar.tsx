"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  Workflow,
  ActivitySquare,
  Sparkles,
  Mail,
  Settings,
  CreditCard,
  ChevronDown,
  LogOut,
  UserCircle,
  ArrowLeftRight,
} from "lucide-react";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const mainNav = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "People",
    href: "/people",
    icon: Users,
    badge: "3",
    badgeClass: "bg-primary/10 text-primary text-xs",
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
    badge: "7",
    badgeClass: "bg-primary/10 text-primary text-xs",
  },
  {
    label: "Sequences",
    href: "/sequences",
    icon: Workflow,
  },
  {
    label: "Activities",
    href: "/activities",
    icon: ActivitySquare,
  },
];

const toolsNav = [
  {
    label: "AI Assistant",
    href: "/ai",
    icon: Sparkles,
    badge: "New",
    badgeClass: "bg-primary text-primary-foreground text-xs",
  },
  {
    label: "Email",
    href: "/email",
    icon: Mail,
    showDot: true,
  },
];

const workspaceNav = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Billing", href: "/billing", icon: CreditCard },
];

const workspaces = [
  {
    name: "Acme Inc",
    plan: "Enterprise",
  },
  {
    name: "Acme Corp.",
    plan: "Startup",
  },
  {
    name: "Personal",
    plan: "Free",
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* ── Header ─────────────────────────────────────── */}
      <SidebarHeader>
        <TeamSwitcher teams={workspaces} />
      </SidebarHeader>

      {/* ── Content ────────────────────────────────────── */}
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
                      {item.badge && (
                        <Badge variant="secondary" className={cn("ml-auto", item.badgeClass)}>
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Tools Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {toolsNav.map((item) => {
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
                      <item.icon className={cn("w-4 h-4", isActive && "text-sidebar-primary ")} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <Badge variant="default" className={cn("ml-auto", item.badgeClass)}>
                          {item.badge}
                        </Badge>
                      )}
                      {item.showDot && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-amber-400" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Workspace Group */}
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

      {/* ── Footer ─────────────────────────────────────── */}
      <SidebarFooter className="px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 w-full rounded-md p-2 hover:bg-sidebar-accent transition-colors">
              <Avatar className="w-8 h-8 bg-sidebar-accent">
                <AvatarFallback className="text-xs">AK</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium text-sidebar-foreground">Alex Kim</p>
                <p className="text-xs text-muted-foreground">alex@verio.app</p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuItem>
              <UserCircle className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Switch Workspace
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
