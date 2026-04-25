"use client";

import { Card, CardContent } from "@workspace/ui/components/ui/card";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import { Users, Briefcase, Building2 } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface StatsCardsProps {
  totalDeals?: number;
  totalPeople?: number;
  totalOrgs?: number;
  isLoading: boolean;
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  isLoading: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div
            className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconBg)}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground leading-none mb-1.5">{label}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {value.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ totalDeals, totalPeople, totalOrgs, isLoading }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Total Deals"
        value={totalDeals ?? 0}
        icon={Briefcase}
        iconBg="bg-primary/10 text-primary"
        isLoading={isLoading}
      />
      <StatCard
        label="Total People"
        value={totalPeople ?? 0}
        icon={Users}
        iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        isLoading={isLoading}
      />
      <StatCard
        label="Organizations"
        value={totalOrgs ?? 0}
        icon={Building2}
        iconBg="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        isLoading={isLoading}
      />
    </div>
  );
}
