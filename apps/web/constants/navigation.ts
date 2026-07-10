import {
  Building2,
  Kanban,
  LayoutDashboard,
  Mail,
  Settings,
  Settings2,
  Users,
  FormInput,
  Workflow,
} from "lucide-react";

export const MAIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "People", href: "/people", icon: Users },
  { label: "Organizations", href: "/organizations", icon: Building2 },
  { label: "Deals", href: "/deals", icon: Kanban },
  { label: "Sequences", href: "/sequences", icon: Workflow },
] as const;

export const WORKSPACE_NAV_ITEMS = [
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export const SETTINGS_NAV_ITEMS = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "custom-fields", label: "Custom fields", icon: FormInput },
  { id: "members", label: "Members", icon: Users },
  { id: "invitations", label: "Invitations", icon: Mail },
] as const;

export type SettingsTab = (typeof SETTINGS_NAV_ITEMS)[number]["id"];
