"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Archive,
  ArrowUpRight,
  Cable,
  Mail,
  Plus,
  Reply,
  Send,
  TriangleAlert,
  Users,
  Workflow,
} from "lucide-react";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Button } from "@workspace/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui/card";
import { Input } from "@workspace/ui/components/ui/input";
import { Label } from "@workspace/ui/components/ui/label";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SequenceStatusBadge } from "@/components/sequences/sequence-status-badge";
import {
  useArchiveSequence,
  useConnectGmail,
  useCreateSequence,
  useDisconnectGmail,
  useGmailIntegrations,
  useSequences,
} from "@/hooks/queries/use-sequences";
import type { Sequence } from "@/types/sequence";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.metadata",
];

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-2">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium tabular-nums">{value.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function SequenceRow({
  sequence,
  onArchive,
  archivePending,
}: {
  sequence: Sequence;
  onArchive: (id: string) => void;
  archivePending: boolean;
}) {
  const metrics = sequence.metrics ?? { enrollments: 0, sent: 0, replies: 0, failures: 0 };

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-sm transition-colors hover:border-primary/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold tracking-tight">{sequence.name}</h2>
            <SequenceStatusBadge status={sequence.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Updated {new Date(sequence.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Metric icon={Users} label="enrolled" value={metrics.enrollments} />
          <Metric icon={Send} label="sent" value={metrics.sent} />
          <Metric icon={Reply} label="replies" value={metrics.replies} />
          <Metric icon={TriangleAlert} label="failed" value={metrics.failures} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/sequences/${sequence.id}`}>
            Open
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
        {sequence.status !== "archived" && (
          <Button
            variant="ghost"
            size="sm"
            disabled={archivePending}
            onClick={() => onArchive(sequence.id)}
          >
            <Archive className="size-4" />
            Archive
          </Button>
        )}
      </div>
    </div>
  );
}

function GmailPanel() {
  const [email, setEmail] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const { data: integrations, isLoading } = useGmailIntegrations();
  const connectMutation = useConnectGmail();
  const disconnectMutation = useDisconnectGmail();

  function handleConnect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    connectMutation.mutate({
      email,
      accessToken,
      refreshToken,
      grantedScopes: GMAIL_SCOPES,
    });
  }

  return (
    <Card className="rounded-lg border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cable className="size-4" />
          Gmail Senders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-3" onSubmit={handleConnect}>
          <div className="space-y-1.5">
            <Label htmlFor="gmail-email">Email</Label>
            <Input
              id="gmail-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="sender@example.com"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-1.5">
              <Label htmlFor="gmail-access">Access token</Label>
              <Input
                id="gmail-access"
                value={accessToken}
                onChange={(event) => setAccessToken(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gmail-refresh">Refresh token</Label>
              <Input
                id="gmail-refresh"
                value={refreshToken}
                onChange={(event) => setRefreshToken(event.target.value)}
              />
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={!email || !accessToken || !refreshToken || connectMutation.isPending}
          >
            <Mail className="size-4" />
            Connect Gmail
          </Button>
        </form>

        <div className="space-y-2">
          {isLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : integrations && integrations.length > 0 ? (
            integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/70 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{integration.email}</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {integration.status.replace("_", " ")}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disconnectMutation.isPending}
                  onClick={() => disconnectMutation.mutate(integration.id)}
                >
                  Disconnect
                </Button>
              </div>
            ))
          ) : (
            <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
              No Gmail sender connected.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SequencesListWorkspace() {
  const router = useRouter();
  const [status, setStatus] = useState<Sequence["status"] | "all">("all");
  const params = useMemo(() => (status === "all" ? {} : { status }), [status]);
  const { data, isLoading } = useSequences(params);
  const createMutation = useCreateSequence();
  const archiveMutation = useArchiveSequence();

  function handleCreate() {
    createMutation.mutate(
      { name: `Untitled sequence ${new Date().toLocaleDateString()}` },
      { onSuccess: (sequence) => router.push(`/sequences/${sequence.id}`) },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sequences"
        description="Workspace outbound flows, Gmail senders, and automation health."
        count={data?.meta.totalCount ?? 0}
        actions={
          <Button size="sm" disabled={createMutation.isPending} onClick={handleCreate}>
            <Plus className="size-4" />
            New sequence
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "draft", "published", "paused", "archived"] as const).map((item) => (
              <Button
                key={item}
                variant={status === item ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus(item)}
              >
                {item === "all" ? <Workflow className="size-4" /> : null}
                <span className="capitalize">{item}</span>
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : data?.sequences.length ? (
            data.sequences.map((sequence) => (
              <SequenceRow
                key={sequence.id}
                sequence={sequence}
                archivePending={archiveMutation.isPending}
                onArchive={(id) => archiveMutation.mutate(id)}
              />
            ))
          ) : (
            <EmptyState
              icon={Workflow}
              title="No sequences yet"
              description="Create a draft flow to start building outbound automation."
              action={
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="size-4" />
                  New sequence
                </Button>
              }
            />
          )}
        </div>
        <GmailPanel />
      </div>
    </div>
  );
}
