"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, MailX } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import { confirmUnsubscribe, previewUnsubscribe } from "@/services/sequences.service";

export function UnsubscribeConfirmation({ token }: { token: string }) {
  const previewQuery = useQuery({
    queryKey: ["unsubscribe-preview", token],
    queryFn: () => previewUnsubscribe(token),
    retry: false,
  });
  const confirmMutation = useMutation({
    mutationFn: () => confirmUnsubscribe(token),
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm">
        {previewQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : previewQuery.isError ? (
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <MailX className="size-6" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Unsubscribe link unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This link may have expired or already been removed.
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link href="/">Return home</Link>
            </Button>
          </div>
        ) : confirmMutation.isSuccess || previewQuery.data?.alreadyUnsubscribed ? (
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-6" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Unsubscribed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {previewQuery.data?.email} will no longer receive sequence emails for this workspace.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailX className="size-6" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Confirm unsubscribe</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Suppress {previewQuery.data?.email} from future emails in{" "}
              {previewQuery.data?.sequence.name}.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button asChild variant="outline">
                <Link href="/">Cancel</Link>
              </Button>
              <Button
                disabled={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate()}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
