import type { FilterConfig } from "@/components/shared/data-table";

export const peopleFilters: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "Lead", value: "lead" },
      { label: "Prospect", value: "prospect" },
      { label: "Qualified", value: "qualified" },
      { label: "Customer", value: "customer" },
      { label: "Churned", value: "churned" },
    ],
  },
  {
    key: "source",
    label: "Source",
    options: [
      { label: "Manual", value: "manual" },
      { label: "API", value: "api" },
    ],
  },
];
