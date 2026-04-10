import type { FilterConfig } from "@/components/shared/data-table";

export const ORGS_FILTER_CONFIG: FilterConfig[] = [
  {
    columnId: "industry",
    label: "Industry",
    allLabel: "All Industries",
    options: [
      { label: "Technology", value: "technology" },
      { label: "Finance", value: "finance" },
      { label: "Healthcare", value: "healthcare" },
      { label: "Manufacturing", value: "manufacturing" },
      { label: "Retail", value: "retail" },
      { label: "Consulting", value: "consulting" },
      { label: "Other", value: "other" },
    ],
  },
  {
    columnId: "size",
    label: "Size",
    allLabel: "Any Size",
    options: [
      { label: "1–10", value: "1-10" },
      { label: "11–50", value: "11-50" },
      { label: "51–200", value: "51-200" },
      { label: "201–500", value: "201-500" },
      { label: "500+", value: "500+" },
    ],
  },
];
