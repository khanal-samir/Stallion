"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, ShieldCheck } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { Input } from "@workspace/ui/components/ui/input";
import { Label } from "@workspace/ui/components/ui/label";
import { Logo } from "@workspace/ui/components/ui/logo";
import { useAuthSession } from "@/hooks/queries/use-auth";
import {
  useCreateWorkspace,
  useSetActiveWorkspace,
  useWorkspaces,
} from "@/hooks/queries/use-workspace";
import { slugify } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useAuthSession();
  const { data: workspaces, isPending: areWorkspacesPending } = useWorkspaces();
  const { mutate: createWorkspace, isPending: isCreatingWorkspace } = useCreateWorkspace();
  const { mutate: setActiveWorkspace, isPending: isSettingActiveWorkspace } = useSetActiveWorkspace(
    { showToast: false },
  );
  const [isNavigating, startTransition] = useTransition();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [hasEditedSlug, setHasEditedSlug] = useState(false);

  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      router.replace("/login");
      return;
    }
    if (!areWorkspacesPending && workspaces && workspaces.length > 0) {
      router.replace("/dashboard");
    }
  }, [areWorkspacesPending, isSessionPending, router, session?.user, workspaces]);

  function handleNameChange(name: string) {
    setWorkspaceName(name);
    if (!hasEditedSlug) setWorkspaceSlug(slugify(name));
  }

  function handleCreateWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceName.trim()) return;

    createWorkspace(
      {
        name: workspaceName.trim(),
        slug: workspaceSlug || undefined,
      },
      {
        onSuccess: (workspace) => {
          setActiveWorkspace(
            { organizationId: workspace.id },
            {
              onSuccess: () => startTransition(() => router.replace("/dashboard")),
            },
          );
        },
      },
    );
  }

  const isPending =
    isSessionPending ||
    areWorkspacesPending ||
    isCreatingWorkspace ||
    isSettingActiveWorkspace ||
    isNavigating;
  let submitLabel = "Create workspace and continue";
  if (isCreatingWorkspace || isSettingActiveWorkspace) submitLabel = "Creating workspace...";
  if (isNavigating) submitLabel = "Opening CRM...";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -left-24 -top-28 size-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8 sm:px-10">
        <Logo size="sm" />

        <section className="my-auto w-full max-w-xl py-14">
          <div className="mb-8">
            <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Workspace setup
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Create your workspace
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Your CRM records, team access, and settings stay scoped to this workspace.
            </p>
          </div>

          <form
            onSubmit={handleCreateWorkspace}
            className="space-y-6 border-y border-border/70 py-8"
          >
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                autoFocus
                autoComplete="organization"
                placeholder="Acme Revenue Team"
                value={workspaceName}
                onChange={(event) => handleNameChange(event.target.value)}
                disabled={isPending}
                className="h-11 bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Use your company or team name. You can change it later.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-slug">Workspace URL</Label>
              <div className="flex h-11 overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50">
                <span className="flex items-center border-r border-border bg-muted/50 px-3 text-sm text-muted-foreground">
                  stallion.app/
                </span>
                <input
                  id="workspace-slug"
                  value={workspaceSlug}
                  onChange={(event) => {
                    setHasEditedSlug(true);
                    setWorkspaceSlug(slugify(event.target.value));
                  }}
                  disabled={isPending}
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                  placeholder="acme-revenue-team"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isPending || !workspaceName.trim()}
              className="h-11"
            >
              {submitLabel}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-6">
            <span className="flex items-center gap-2">
              <Check className="size-3.5 text-primary" />
              Workspace-scoped data
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-3.5 text-primary" />
              Short guided tour
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-primary" />
              {session?.user.email ?? "Verified account"}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
