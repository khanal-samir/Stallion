"use client";

import { type LucideIcon } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  delta: number;
  deltaLabel: string;
  icon: LucideIcon;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  valueClassName,
}: StatCardProps) {
  const isPositive = delta >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold", valueClassName)}>{value}</div>
        <p className={cn("text-xs mt-1", isPositive ? "text-emerald-500" : "text-red-500")}>
          {isPositive ? "+" : ""}
          {delta}% {deltaLabel}
        </p>
      </CardContent>
    </Card>
  );
}
