"use client";

import Link from "next/link";
import { ArrowUpRight, BarChart3, BriefcaseBusiness, Building2, UsersRound } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui/card";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import { StatsCards } from "@/components/crm/dashboard/stats-cards";
import { SequenceAutomationPanel } from "@/components/crm/dashboard/sequence-automation-panel";
import { PipelineChart } from "@/components/crm/dashboard/pipeline-chart";
import { PeopleStatusChart } from "@/components/crm/dashboard/people-status-chart";
import { WinRateCard } from "@/components/crm/dashboard/win-rate-card";
import { PageHeader } from "@/components/layout/page-header";
import { usePipelineByStage, usePeopleByStatus, useWinRate } from "@/hooks/queries/use-analytics";
import { useOrganizations } from "@/hooks/queries/use-org";

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  demo: "Demo",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={
        className ??
        "overflow-hidden rounded-[1.5rem] border-border/70 bg-card/88 shadow-sm backdrop-blur-xl"
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PipelineFocusList({ data }: { data: { stage: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((item) => item.count), 1);

  if (data.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        No deal stages have activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const width = `${Math.max((item.count / maxCount) * 100, 8)}%`;

        return (
          <div key={item.stage} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{STAGE_LABELS[item.stage] ?? item.stage}</span>
              <span className="tabular-nums text-muted-foreground">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { data: pipelineData, isLoading: pipelineLoading } = usePipelineByStage();
  const { data: peopleStatusData, isLoading: peopleLoading } = usePeopleByStatus();
  const { data: winRateData, isLoading: winRateLoading } = useWinRate();
  const { data: orgsData, isLoading: orgsLoading } = useOrganizations({ pageSize: 1 });

  const totalDeals = pipelineData?.reduce((sum, d) => sum + d.count, 0) ?? 0;
  const totalPeople = peopleStatusData?.reduce((sum, p) => sum + p.count, 0) ?? 0;
  const totalOrgs = orgsData?.meta.totalCount ?? 0;
  const isLoading = pipelineLoading || peopleLoading || winRateLoading || orgsLoading;
  const topStage = [...(pipelineData ?? [])].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-6" data-tour="dashboard-page">
      <PageHeader
        title="Dashboard"
        description="Workspace pipeline, contacts, and account coverage at a glance."
        count={totalDeals + totalPeople}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/people">
                People
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/deals">
                Deals
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div data-tour="dashboard-overview">
        <StatsCards
          totalDeals={totalDeals}
          totalPeople={totalPeople}
          totalOrgs={totalOrgs}
          isLoading={isLoading}
        />
      </div>

      <SequenceAutomationPanel />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <DashboardPanel
            title="Pipeline by Stage"
            description="Deal distribution across your active sales process."
            action={
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/deals">
                  Pipeline
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            }
          >
            {pipelineLoading ? (
              <Skeleton className="aspect-4/3 w-full" />
            ) : (
              <PipelineChart data={pipelineData ?? []} />
            )}
          </DashboardPanel>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardPanel
              title="People by Status"
              description="Contact distribution by lifecycle stage."
              action={<UsersRound className="mt-1 size-5 text-muted-foreground" />}
            >
              {peopleLoading ? (
                <Skeleton className="aspect-4/3 w-full" />
              ) : (
                <PeopleStatusChart data={peopleStatusData ?? []} />
              )}
            </DashboardPanel>

            <DashboardPanel
              title="Pipeline Focus"
              description="Where your current opportunities are concentrated."
              action={<BarChart3 className="mt-1 size-5 text-muted-foreground" />}
            >
              {pipelineLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-5/6" />
                  <Skeleton className="h-8 w-3/4" />
                </div>
              ) : (
                <PipelineFocusList data={pipelineData ?? []} />
              )}
            </DashboardPanel>
          </div>
        </div>

        <div className="space-y-6">
          <WinRateCard
            won={winRateData?.won ?? 0}
            lost={winRateData?.lost ?? 0}
            total={winRateData?.total ?? 0}
            rate={winRateData?.rate ?? 0}
          />

          <DashboardPanel
            title="Executive Snapshot"
            description="Quick read on workspace momentum."
            className="overflow-hidden rounded-[1.5rem] border-border/70 bg-card/88 shadow-sm backdrop-blur-xl"
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BriefcaseBusiness className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Top pipeline stage</p>
                    <p className="text-xs text-muted-foreground">
                      {topStage
                        ? `${STAGE_LABELS[topStage.stage] ?? topStage.stage} has ${topStage.count} deals`
                        : "No pipeline activity yet"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <UsersRound className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contact coverage</p>
                    <p className="text-xs text-muted-foreground">
                      {totalPeople.toLocaleString()} people across {totalOrgs.toLocaleString()}{" "}
                      accounts
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Account system</p>
                    <p className="text-xs text-muted-foreground">
                      {totalOrgs > 0
                        ? "Organization records are ready for relationship tracking"
                        : "Add organizations to unlock account context"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
