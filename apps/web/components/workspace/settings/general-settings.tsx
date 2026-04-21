"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LogOut as LogOutIcon, Pencil, Trash2 } from "lucide-react";
import {
  updateWorkspaceSchema,
  type UpdateWorkspace,
} from "@workspace/validators/schemas/workspace";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/ui/form";
import { Input } from "@workspace/ui/components/ui/input";
import { Button } from "@workspace/ui/components/ui/button";
import { Separator } from "@workspace/ui/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useDeleteWorkspace,
  useLeaveWorkspace,
  useUpdateWorkspace,
} from "@/hooks/queries/use-workspace";
import { useAuthSession } from "@/hooks/queries/use-auth";
import { Logo } from "@workspace/ui/components/ui/logo";
import type { GeneralSettingsProps } from "@/types/workspace-settings";

type DialogState = "idle" | "editing" | "delete" | "leave";

export function GeneralSettings({ workspace }: GeneralSettingsProps) {
  const router = useRouter();
  const { data: session } = useAuthSession();
  const { mutate: updateWorkspaceMutation, isPending: isUpdatePending } = useUpdateWorkspace(
    workspace.id,
  );
  const { mutate: deleteWorkspaceMutation, isPending: isDeletePending } = useDeleteWorkspace();
  const { mutate: leaveWorkspaceMutation, isPending: isLeavePending } = useLeaveWorkspace();

  const [dialogState, setDialogState] = useState<DialogState>("idle");

  const isOwner = session?.user?.id === workspace.ownerId;

  const form = useForm<UpdateWorkspace>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: workspace.name,
      slug: workspace.slug,
      logo: workspace.logo ?? undefined,
    },
  });

  function onSubmit(data: UpdateWorkspace) {
    updateWorkspaceMutation(data, {
      onSuccess: () => setDialogState("idle"),
    });
  }

  function handleDelete() {
    deleteWorkspaceMutation(workspace.id, {
      onSuccess: () => {
        setDialogState("idle");
        router.push("/onboarding");
      },
    });
  }

  function handleLeave() {
    leaveWorkspaceMutation(workspace.id, {
      onSuccess: () => {
        setDialogState("idle");
        router.push("/onboarding");
      },
    });
  }

  return (
    <div className="space-y-8">
      {/* Profile section */}
      <section className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-medium">Workspace profile</h2>
            <p className="text-sm text-muted-foreground">Name and URL shown across Stallion.</p>
          </div>
          {dialogState === "idle" && (
            <Button variant="outline" size="sm" onClick={() => setDialogState("editing")}>
              <Pencil className="mr-1.5 size-3.5" />
              Edit
            </Button>
          )}
        </div>

        {dialogState === "editing" ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Logo size="md" showText={false} />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isUpdatePending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL slug</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isUpdatePending} />
                      </FormControl>
                      <FormDescription>
                        Lowercase letters, numbers, and hyphens only.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isUpdatePending}>
                  {isUpdatePending ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.reset();
                    setDialogState("idle");
                  }}
                  disabled={isUpdatePending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Logo size="md" showText={false} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{workspace.name}</p>
              <p className="text-xs text-muted-foreground">/{workspace.slug}</p>
            </div>
            <div className="ml-auto shrink-0 text-xs text-muted-foreground">
              {isOwner ? "Owner" : "Member"}
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* Danger zone */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-medium text-destructive">Danger zone</h2>
          <p className="text-sm text-muted-foreground">
            Irreversible actions. Be certain before proceeding.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-destructive/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Leave workspace</p>
              <p className="text-xs text-muted-foreground">
                You will lose access to all workspace data.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogState("leave")}
              className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOutIcon className="mr-1.5 size-3.5" />
              Leave
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete workspace</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this workspace and all its data.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDialogState("delete")}
              className="shrink-0"
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={dialogState === "delete"}
        onOpenChange={(open) => setDialogState(open ? "delete" : "idle")}
        title="Delete workspace"
        description={`This will permanently delete "${workspace.name}" and all associated data including contacts, deals, and sequences. This action cannot be undone.`}
        confirmLabel="Delete workspace"
        variant="destructive"
        isPending={isDeletePending}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={dialogState === "leave"}
        onOpenChange={(open) => setDialogState(open ? "leave" : "idle")}
        title="Leave workspace"
        description={`You will lose access to "${workspace.name}". You'll need a new invitation to rejoin.`}
        confirmLabel="Leave workspace"
        variant="destructive"
        isPending={isLeavePending}
        onConfirm={handleLeave}
      />
    </div>
  );
}
