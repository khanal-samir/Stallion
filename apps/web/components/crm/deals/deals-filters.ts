import type { FilterConfig } from "@/components/shared/data-table";
import { DEAL_STAGE_OPTIONS } from "./deals-options";

export const DEALS_FILTER_CONFIG: FilterConfig[] = [
  {
    columnId: "stage",
    label: "Stage",
    options: DEAL_STAGE_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
  },
];
