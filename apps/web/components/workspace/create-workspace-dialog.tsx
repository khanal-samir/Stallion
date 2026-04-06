"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createWorkspaceSchema,
  type CreateWorkspace,
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
import { SharedDialog } from "@/components/shared/shared-dialog";
import { useCreateWorkspace, useSetActiveWorkspace } from "@/hooks/queries/use-workspace";
import { slugify } from "@/lib/utils";
import { useEffect } from "react";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const createWorkspace = useCreateWorkspace();
  const setActiveWorkspace = useSetActiveWorkspace();

  const form = useForm<CreateWorkspace>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const watchedName = form.watch("name");

  // Auto-generate slug from name unless user has manually edited it
  useEffect(() => {
    const currentSlug = form.getValues("slug");
    const autoSlug = slugify(watchedName);
    // Only auto-set if slug matches what auto-generation would produce from previous name,
    // or if slug is empty (meaning user hasn't manually edited it)
    if (
      !currentSlug ||
      currentSlug === slugify(form.getValues("name").slice(0, -1)) ||
      currentSlug === autoSlug
    ) {
      form.setValue("slug", autoSlug, { shouldValidate: !!autoSlug });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedName]);

  function onSubmit(data: CreateWorkspace) {
    createWorkspace.mutate(data, {
      onSuccess: (workspace) => {
        setActiveWorkspace.mutate(
          { organizationId: workspace.id },
          {
            onSuccess: () => {
              form.reset();
              onOpenChange(false);
            },
          },
        );
      },
    });
  }

  const isPending = createWorkspace.isPending || setActiveWorkspace.isPending;

  return (
    <SharedDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create workspace"
      description="Workspaces help you organize your team and CRM data."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workspace name</FormLabel>
                <FormControl>
                  <Input placeholder="My Team" {...field} disabled={isPending} />
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
                  <Input placeholder="my-team" {...field} disabled={isPending} />
                </FormControl>
                <FormDescription>
                  Used in URLs. Lowercase letters, numbers, and hyphens.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create workspace"}
            </Button>
          </div>
        </form>
      </Form>
    </SharedDialog>
  );
}
