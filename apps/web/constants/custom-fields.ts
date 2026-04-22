import { Users, Building2 } from "lucide-react";
import type { CustomFieldType } from "@/types/crm";

export type CustomFieldEntity = "people" | "org";

export const CUSTOM_FIELD_TYPE_OPTIONS: Array<{ label: string; value: CustomFieldType }> = [
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Select", value: "select" },
  { label: "Date & Time", value: "dateTime" },
];

export const ENTITY_CONFIG: Record<
  CustomFieldEntity,
  { label: string; icon: typeof Users }
> = {
  people: { label: "People", icon: Users },
  org: { label: "Organizations", icon: Building2 },
};

export function typeBadgeVariant(type: CustomFieldType): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "text":
      return "default";
    case "number":
      return "secondary";
    case "select":
      return "outline";
    case "dateTime":
      return "destructive";
    default:
      return "default";
  }
}

export function typeLabel(type: CustomFieldType) {
  return CUSTOM_FIELD_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}
