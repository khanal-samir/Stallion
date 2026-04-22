import type { FilterConfig } from "@/components/shared/data-table";
import { ORG_INDUSTRY_OPTIONS, ORG_SIZE_OPTIONS } from "@/components/crm/crm-options";

export const ORGS_FILTER_CONFIG: FilterConfig[] = [
  {
    columnId: "industry",
    label: "Industry",
    allLabel: "All Industries",
    options: ORG_INDUSTRY_OPTIONS,
  },
  {
    columnId: "size",
    label: "Size",
    allLabel: "Any Size",
    options: ORG_SIZE_OPTIONS,
  },
];
