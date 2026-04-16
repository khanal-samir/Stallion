import type { PersonSource, PersonStatus } from "@workspace/validators/schemas/crm";

export const PERSON_STATUS_OPTIONS = [
  {
    value: "lead" satisfies PersonStatus,
    label: "Lead",
    badgeClassName:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-transparent",
  },
  {
    value: "prospect" satisfies PersonStatus,
    label: "Prospect",
    badgeClassName:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-transparent",
  },
  {
    value: "qualified" satisfies PersonStatus,
    label: "Qualified",
    badgeClassName:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-transparent",
  },
  {
    value: "customer" satisfies PersonStatus,
    label: "Customer",
    badgeClassName:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border-transparent",
  },
  {
    value: "churned" satisfies PersonStatus,
    label: "Churned",
    badgeClassName:
      "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-transparent",
  },
];

export const PERSON_SOURCE_OPTIONS = [
  { value: "manual" satisfies PersonSource, label: "Manual" },
  { value: "csv" satisfies PersonSource, label: "CSV import" },
  { value: "api" satisfies PersonSource, label: "API" },
];

export const ORG_INDUSTRY_OPTIONS = [
  { label: "Technology", value: "technology" },
  { label: "Finance", value: "finance" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Retail", value: "retail" },
  { label: "Consulting", value: "consulting" },
  { label: "Other", value: "other" },
];

export const ORG_SIZE_OPTIONS = [
  { label: "1–10", value: "1-10" },
  { label: "11–50", value: "11-50" },
  { label: "51–200", value: "51-200" },
  { label: "201–500", value: "201-500" },
  { label: "500+", value: "500+" },
];
