"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui/card";
import { Badge } from "@workspace/ui/components/ui/badge";
import { cn } from "@workspace/ui/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WinRateCardProps {
  won: number;
  lost: number;
  total: number;
  rate: number;
}

function CircularProgress({
  value,
  size = 96,
  strokeWidth = 8,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  let strokeColor = "#3b82f6";
  if (value >= 60) strokeColor = "#10b981";
  else if (value >= 40) strokeColor = "#f59e0b";
  else if (value > 0) strokeColor = "#f43f5e";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-xl font-bold tabular-nums">{value}%</span>
    </div>
  );
}

export function WinRateCard({ won, lost, total, rate }: WinRateCardProps) {
  const TrendIcon = rate > 50 ? TrendingUp : rate < 50 ? TrendingDown : Minus;
  const trendColor =
    rate > 50
      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
      : rate < 50
        ? "text-rose-600 bg-rose-50 dark:bg-rose-950/30"
        : "text-amber-600 bg-amber-50 dark:bg-amber-950/30";

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
          <Badge
            variant="secondary"
            className={cn("text-xs font-medium gap-1 px-2 py-0.5", trendColor)}
          >
            <TrendIcon className="h-3 w-3" />
            {rate > 50 ? "Above avg" : rate < 50 ? "Below avg" : "Even"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-center py-2">
          <CircularProgress value={rate} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 px-2 py-2.5">
            <span className="text-xs text-muted-foreground">Won</span>
            <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {won}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-950/20 px-2 py-2.5">
            <span className="text-xs text-muted-foreground">Lost</span>
            <span className="text-lg font-semibold text-rose-700 dark:text-rose-400 tabular-nums">
              {lost}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-900/40 px-2 py-2.5">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-lg font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {total}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
