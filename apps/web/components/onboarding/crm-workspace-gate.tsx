"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@workspace/ui/components/ui/logo";
import { Button } from "@workspace/ui/components/ui/button";
import { useAuthSession } from "@/hooks/queries/use-auth";
import { useRestoreActiveWorkspace, useWorkspaces } from "@/hooks/queries/use-workspace";

interface CrmWorkspaceGateProps {
  children: React.ReactNode;
}

export function CrmWorkspaceGate({ children }: CrmWorkspaceGateProps) {
  const router = useRouter();
  const {
    data: session,
    isPending: isSessionPending,
    isError: isSessionError,
    refetch: refetchSession,
  } = useAuthSession();
  const {
    data: workspaces,
    isPending: areWorkspacesPending,
    isError: areWorkspacesError,
    refetch: refetchWorkspaces,
  } = useWorkspaces();
  const firstWorkspaceId = workspaces?.[0]?.id;
  const activeWorkspaceId = session?.session?.activeOrganizationId;

  useRestoreActiveWorkspace({
    isSignedIn: Boolean(session?.user),
    activeOrganizationId: activeWorkspaceId,
    firstWorkspaceId,
  });

  useEffect(() => {
    if (isSessionPending) return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }
    if (areWorkspacesPending || !workspaces) return;
    if (workspaces.length === 0) router.replace("/onboarding");
  }, [areWorkspacesPending, isSessionPending, router, session?.user, workspaces]);

  if (isSessionError || areWorkspacesError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <p className="text-sm font-semibold text-foreground">
            Workspace access could not be verified
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Retry before opening workspace-scoped CRM data.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              void refetchSession();
              void refetchWorkspaces();
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const isResolvingWorkspace =
    isSessionPending ||
    !session?.user ||
    areWorkspacesPending ||
    !workspaces ||
    workspaces.length === 0 ||
    !activeWorkspaceId;

  if (isResolvingWorkspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo size="sm" />
          <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-[workspace-loading_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Preparing workspace
          </p>
        </div>
      </div>
    );
  }

  return children;
}
