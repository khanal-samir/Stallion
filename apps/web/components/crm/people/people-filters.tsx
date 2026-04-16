import type { FilterConfig } from "@/components/shared/data-table";
import { PERSON_SOURCE_OPTIONS, PERSON_STATUS_OPTIONS } from "@/components/crm/crm-options";

export const PEOPLE_FILTER_CONFIG: FilterConfig[] = [
  {
    columnId: "status",
    label: "Status",
    allLabel: "All Statuses",
    options: PERSON_STATUS_OPTIONS.map(({ label, value }) => ({ label, value })),
  },
  {
    columnId: "source",
    label: "Source",
    allLabel: "All Sources",
    options: PERSON_SOURCE_OPTIONS.map(({ label, value }) => ({ label, value })),
  },
];
