"use client";

import { Download, Workflow, Send, MailOpen, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmailChart } from "@/components/dashboard/email-chart";
import { LeadsDonut } from "@/components/dashboard/leads-donut";
import { PipelineOverview } from "@/components/dashboard/pipeline-overview";
import { TasksToday } from "@/components/dashboard/tasks-today";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Feb 26 &ndash; Mar 4, 2026</span>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Active Enrollments"
          value={298}
          delta={12}
          deltaLabel="from last week"
          icon={Workflow}
        />
        <StatCard
          label="Emails Sent (7d)"
          value={253}
          delta={8}
          deltaLabel="from last week"
          icon={Send}
        />
        <StatCard
          label="Open Rate %"
          value="64.2%"
          delta={3.1}
          deltaLabel="from last week"
          icon={MailOpen}
          valueClassName="text-primary"
        />
        <StatCard
          label="Reply Rate %"
          value="18.5%"
          delta={-2.4}
          deltaLabel="from last week"
          icon={Reply}
          valueClassName="text-amber-500"
        />
      </div>

      {/* ── Charts Row ──────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <EmailChart />
        <LeadsDonut />
      </div>

      {/* ── Pipeline + Tasks ────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <PipelineOverview />
        <TasksToday />
      </div>

      {/* ── Activity Feed ───────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <ActivityFeed />
      </div>
    </div>
  );
}
