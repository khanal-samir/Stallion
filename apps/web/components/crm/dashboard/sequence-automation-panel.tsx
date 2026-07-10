"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Check, MailCheck, Reply, Send, Users } from "lucide-react";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Button } from "@workspace/ui/components/ui/button";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import {
  useCompleteSequenceTask,
  useSequenceDashboard,
} from "@/hooks/queries/use-sequences";

function Counter({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

export function SequenceAutomationPanel() {
  const { data, isLoading } = useSequenceDashboard();
  const completeTaskMutation = useCompleteSequenceTask();

  if (isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }

  const counters = data?.counters ?? {
    activeEnrollments: 0,
    emailsSentToday: 0,
    repliesDetected: 0,
    failedSteps: 0,
  };

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/88 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Sequence Automation</h2>
          <p className="mt-1 text-sm text-muted-foreground">Due work, sender health, and recent events.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/sequences">
            Sequences
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Counter label="Active enrollments" value={counters.activeEnrollments} icon={Users} />
        <Counter label="Emails today" value={counters.emailsSentToday} icon={Send} />
        <Counter label="Replies" value={counters.repliesDetected} icon={Reply} />
        <Counter label="Failed steps" value={counters.failedSteps} icon={AlertTriangle} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Due tasks</h3>
          {(data?.dueTasks ?? []).slice(0, 4).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{task.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {task.person?.name ?? task.type.replace("_", " ")}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={completeTaskMutation.isPending}
                onClick={() => completeTaskMutation.mutate(task.id)}
              >
                <Check className="size-4" />
              </Button>
            </div>
          ))}
          {data?.dueTasks.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              No due sequence tasks.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Gmail warnings</h3>
          {(data?.gmailWarnings ?? []).slice(0, 4).map((warning) => (
            <div key={warning.id} className="rounded-lg border border-border/70 p-3">
              <div className="flex items-center gap-2">
                <MailCheck className="size-4 text-muted-foreground" />
                <p className="truncate text-sm font-medium">{warning.email}</p>
              </div>
              <Badge variant="outline" className="mt-2 capitalize">
                {warning.status.replace("_", " ")}
              </Badge>
            </div>
          ))}
          {data?.gmailWarnings.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              Gmail senders are healthy.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Recent activity</h3>
          {(data?.recentActivity ?? []).slice(0, 4).map((event) => (
            <div key={event.id} className="rounded-lg border border-border/70 p-3">
              <p className="truncate text-sm">{event.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(event.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {data?.recentActivity.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              No sequence activity yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
