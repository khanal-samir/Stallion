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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useDeleteWorkspace,
  useLeaveWorkspace,
  useUpdateWorkspace,
} from "@/hooks/queries/use-workspace";
import { useAuthSession } from "@/hooks/queries/use-auth";
import { Logo } from "@/components/ui/logo";

interface GeneralSettingsProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    ownerId?: string;
    metadata?: Record<string, unknown>;
  };
}

export function GeneralSettings({ workspace }: GeneralSettingsProps) {
  const router = useRouter();
  const { data: session } = useAuthSession();
  const updateWorkspace = useUpdateWorkspace(workspace.id);
  const deleteWorkspace = useDeleteWorkspace();
  const leaveWorkspace = useLeaveWorkspace();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

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
    updateWorkspace.mutate(data, {
      onSuccess: () => setIsEditing(false),
    });
  }

  function handleDelete() {
    deleteWorkspace.mutate(workspace.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        router.push("/onboarding");
      },
    });
  }

  function handleLeave() {
    leaveWorkspace.mutate(workspace.id, {
      onSuccess: () => {
        setShowLeaveDialog(false);
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
            <p className="text-sm text-muted-foreground">Name and URL shown across Verio.</p>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-1.5 size-3.5" />
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
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
                        <Input {...field} disabled={updateWorkspace.isPending} />
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
                        <Input {...field} disabled={updateWorkspace.isPending} />
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
                <Button type="submit" size="sm" disabled={updateWorkspace.isPending}>
                  {updateWorkspace.isPending ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.reset();
                    setIsEditing(false);
                  }}
                  disabled={updateWorkspace.isPending}
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
          {!isOwner && (
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
                onClick={() => setShowLeaveDialog(true)}
                className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOutIcon className="mr-1.5 size-3.5" />
                Leave
              </Button>
            </div>
          )}

          {isOwner && (
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
                onClick={() => setShowDeleteDialog(true)}
                className="shrink-0"
              >
                <Trash2 className="mr-1.5 size-3.5" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete workspace"
        description={`This will permanently delete "${workspace.name}" and all associated data including contacts, deals, and sequences. This action cannot be undone.`}
        confirmLabel="Delete workspace"
        variant="destructive"
        isPending={deleteWorkspace.isPending}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        title="Leave workspace"
        description={`You will lose access to "${workspace.name}". You'll need a new invitation to rejoin.`}
        confirmLabel="Leave workspace"
        variant="destructive"
        isPending={leaveWorkspace.isPending}
        onConfirm={handleLeave}
      />
    </div>
  );
}
