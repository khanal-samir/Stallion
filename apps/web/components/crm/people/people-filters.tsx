import type { FilterConfig } from "@/components/shared/data-table";

export const PEOPLE_FILTER_CONFIG: FilterConfig[] = [
  {
    columnId: "status",
    label: "Status",
    allLabel: "All Statuses",
    options: [
      { label: "Lead", value: "lead" },
      { label: "Prospect", value: "prospect" },
      { label: "Qualified", value: "qualified" },
      { label: "Customer", value: "customer" },
      { label: "Churned", value: "churned" },
    ],
  },
  {
    columnId: "source",
    label: "Source",
    allLabel: "All Sources",
    options: [
      { label: "Manual", value: "manual" },
      { label: "CSV import", value: "csv" },
      { label: "API", value: "api" },
    ],
  },
];
