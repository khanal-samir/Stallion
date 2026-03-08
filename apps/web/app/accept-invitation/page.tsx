"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/loading-state";
import { NotFoundState } from "@/components/shared/not-found-state";
import {
  useInvitation,
  useAcceptInvitation,
  useRejectInvitation,
  useSetActiveWorkspace,
} from "@/hooks/queries/use-workspace";
import { useSession } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invitationId = searchParams.get("id");

  const { data: session, isPending: sessionPending } = useSession();
  const { data: invitation, isPending, isError } = useInvitation(invitationId);
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();
  const setActiveWorkspace = useSetActiveWorkspace();

  // No invitation ID in URL
  if (!invitationId) {
    return (
      <NotFoundState
        title="Invalid invitation"
        description="No invitation ID was provided. Please check the link and try again."
        backHref="/"
        backLabel="Go to home"
      />
    );
  }

  if (isPending || sessionPending) {
    return <LoadingState variant="page" text="Loading invitation..." />;
  }

  if (isError || !invitation) {
    return (
      <NotFoundState
        title="Invitation not found"
        description="This invitation may have expired, been canceled, or already been used."
        backHref="/"
        backLabel="Go to home"
      />
    );
  }

  // User not logged in — prompt them to sign in first
  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="size-6 text-primary" />
              </div>
            </div>
            <CardTitle>You&apos;ve been invited</CardTitle>
            <CardDescription>
              Sign in or create an account to accept this invitation
              {invitation.organizationName ? ` to ${invitation.organizationName}` : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link href={`/login?callbackUrl=/accept-invitation?id=${invitationId}`}>
                Sign in
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/signup?callbackUrl=/accept-invitation?id=${invitationId}`}>
                Create an account
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAccepting = acceptInvitation.isPending || setActiveWorkspace.isPending;
  const invitationOrganizationId = invitation.organizationId;

  function handleAccept() {
    acceptInvitation.mutate(invitationId!, {
      onSuccess: () => {
        if (invitationOrganizationId) {
          setActiveWorkspace.mutate(
            { organizationId: invitationOrganizationId },
            {
              onSuccess: () => router.push("/dashboard"),
            },
          );
          return;
        }

        router.push("/dashboard");
      },
    });
  }

  function handleReject() {
    rejectInvitation.mutate(invitationId!, {
      onSuccess: () => router.push("/dashboard"),
    });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {invitation.organizationName ? (
              <Logo size="md" />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="size-6 text-primary" />
              </div>
            )}
          </div>
          <CardTitle>Workspace invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join{" "}
            <span className="font-medium text-foreground">
              {invitation.organizationName ?? "a workspace"}
            </span>{" "}
            as a{" "}
            <Badge variant="secondary" className="ml-0.5">
              {invitation.role}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={handleAccept} disabled={isAccepting || rejectInvitation.isPending}>
            {isAccepting ? "Joining..." : "Accept invitation"}
          </Button>
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isAccepting || rejectInvitation.isPending}
          >
            {rejectInvitation.isPending ? "Declining..." : "Decline"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<LoadingState variant="page" text="Loading..." />}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
