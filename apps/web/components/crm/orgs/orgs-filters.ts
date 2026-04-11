import type { FilterConfig } from "@/components/shared/data-table";

export const orgsFilters: FilterConfig[] = [
  {
    key: "industry",
    label: "Industry",
    options: [
      { label: "Technology", value: "Technology" },
      { label: "Finance", value: "Finance" },
      { label: "Healthcare", value: "Healthcare" },
      { label: "Manufacturing", value: "Manufacturing" },
      { label: "Retail", value: "Retail" },
      { label: "Consulting", value: "Consulting" },
    ],
  },
  {
    key: "size",
    label: "Size",
    options: [
      { label: "1-10", value: "1-10" },
      { label: "11-50", value: "11-50" },
      { label: "51-200", value: "51-200" },
      { label: "201-500", value: "201-500" },
      { label: "500+", value: "500+" },
    ],
  },
];
