import type { DealStage } from "@workspace/validators/schemas/crm";

export const DEAL_STAGE_OPTIONS: {
  value: DealStage;
  label: string;
  badgeClassName: string;
  columnClassName: string;
}[] = [
  {
    value: "new",
    label: "New",
    badgeClassName:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-transparent",
    columnClassName: "border-t-slate-400 dark:border-t-slate-500",
  },
  {
    value: "contacted",
    label: "Contacted",
    badgeClassName:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-transparent",
    columnClassName: "border-t-blue-400 dark:border-t-blue-500",
  },
  {
    value: "demo",
    label: "Demo",
    badgeClassName:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border-transparent",
    columnClassName: "border-t-violet-400 dark:border-t-violet-500",
  },
  {
    value: "proposal",
    label: "Proposal",
    badgeClassName:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-transparent",
    columnClassName: "border-t-amber-400 dark:border-t-amber-500",
  },
  {
    value: "won",
    label: "Won",
    badgeClassName:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-transparent",
    columnClassName: "border-t-emerald-400 dark:border-t-emerald-500",
  },
  {
    value: "lost",
    label: "Lost",
    badgeClassName:
      "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-transparent",
    columnClassName: "border-t-rose-400 dark:border-t-rose-500",
  },
];

export const DEAL_STAGE_MAP = Object.fromEntries(
  DEAL_STAGE_OPTIONS.map((o) => [o.value, o]),
) as Record<DealStage, (typeof DEAL_STAGE_OPTIONS)[number]>;
