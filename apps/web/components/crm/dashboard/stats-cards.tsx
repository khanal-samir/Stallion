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
  iconClassName,
  accentClassName,
  description,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconClassName: string;
  accentClassName: string;
  description: string;
  isLoading: boolean;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-[1.5rem] border-border/70 bg-card/88 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl">
      <div className={cn("absolute inset-x-0 top-0 h-1", accentClassName)} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-20" />
            ) : (
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                {value.toLocaleString()}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{description}</p>
          </div>
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
              iconClassName,
            )}
          >
            <Icon className="size-5" />
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
        iconClassName="bg-primary text-primary-foreground shadow-lg shadow-primary/20"
        accentClassName="bg-primary"
        description="Opportunities moving through the pipeline"
        isLoading={isLoading}
      />
      <StatCard
        label="Total People"
        value={totalPeople ?? 0}
        icon={Users}
        iconClassName="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        accentClassName="bg-emerald-500"
        description="Contacts, leads, and customers tracked"
        isLoading={isLoading}
      />
      <StatCard
        label="Organizations"
        value={totalOrgs ?? 0}
        icon={Building2}
        iconClassName="bg-violet-500/10 text-violet-700 dark:text-violet-300"
        accentClassName="bg-violet-500"
        description="Accounts in the workspace database"
        isLoading={isLoading}
      />
    </div>
  );
}
