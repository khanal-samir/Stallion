"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StatsCards } from "@/components/crm/dashboard/stats-cards";
import { PipelineChart } from "@/components/crm/dashboard/pipeline-chart";
import { PeopleStatusChart } from "@/components/crm/dashboard/people-status-chart";
import { WinRateCard } from "@/components/crm/dashboard/win-rate-card";
import { usePipelineByStage, usePeopleByStatus, useWinRate } from "@/hooks/queries/use-analytics";
import { useOrganizations } from "@/hooks/queries/use-org";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui/card";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";

export default function Dashboard() {
  const { data: pipelineData, isLoading: pipelineLoading } = usePipelineByStage();
  const { data: peopleStatusData, isLoading: peopleLoading } = usePeopleByStatus();
  const { data: winRateData, isLoading: winRateLoading } = useWinRate();
  const { data: orgsData, isLoading: orgsLoading } = useOrganizations({ pageSize: 1 });

  const totalDeals = pipelineData?.reduce((sum, d) => sum + d.count, 0) ?? 0;
  const totalPeople = peopleStatusData?.reduce((sum, p) => sum + p.count, 0) ?? 0;
  const totalOrgs = orgsData?.meta.totalCount ?? 0;
  const isLoading = pipelineLoading || peopleLoading || winRateLoading || orgsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your workspace performance."
        count={totalDeals + totalPeople}
      />

      <StatsCards
        totalDeals={totalDeals}
        totalPeople={totalPeople}
        totalOrgs={totalOrgs}
        isLoading={isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Pipeline by Stage</CardTitle>
            <p className="text-sm text-muted-foreground">
              Deal distribution across your sales pipeline
            </p>
          </CardHeader>
          <CardContent>
            {pipelineLoading ? (
              <Skeleton className="aspect-4/3 w-full" />
            ) : (
              <PipelineChart data={pipelineData ?? []} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <WinRateCard
            won={winRateData?.won ?? 0}
            lost={winRateData?.lost ?? 0}
            total={winRateData?.total ?? 0}
            rate={winRateData?.rate ?? 0}
          />

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">People by Status</CardTitle>
              <p className="text-sm text-muted-foreground">
                Contact distribution by lifecycle stage
              </p>
            </CardHeader>
            <CardContent>
              {peopleLoading ? (
                <Skeleton className="aspect-4/3 w-full" />
              ) : (
                <PeopleStatusChart data={peopleStatusData ?? []} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
