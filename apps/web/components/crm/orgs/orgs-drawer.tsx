"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { createOrgSchema, type CreateOrg } from "@workspace/validators/schemas/crm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/ui/form";
import { Input } from "@workspace/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select";
import { Separator } from "@workspace/ui/components/ui/separator";
import { EntitySheet, type EntitySheetMode } from "@/components/shared/entity-sheet";
import { useCreateOrg, useUpdateOrg, useDeleteOrg } from "@/hooks/queries/use-orgs";
import type { Organization } from "@/types/crm";
import { ORG_INDUSTRY_OPTIONS, ORG_SIZE_OPTIONS } from "@/components/crm/crm-options";

// ─── View helpers ─────────────────────────────────────────────────────────────

function ViewField({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}) {
  const content = children ?? value;
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      {content ? (
        <p className="text-sm">{content}</p>
      ) : (
        <p className="text-sm text-muted-foreground/50">—</p>
      )}
    </div>
  );
}

function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function capitalize(str: string | null | undefined): string | null | undefined {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OrgAvatar() {
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
      <Building2 className="size-5" />
    </div>
  );
}

function ViewContent({ org }: { org: Organization }) {
  return (
    <div className="space-y-6">
      {/* Identity */}
      <div className="flex items-center gap-3">
        <OrgAvatar />
        <div>
          <p className="font-semibold text-foreground">{org.name}</p>
          {org.domain && <p className="text-sm text-muted-foreground">{org.domain}</p>}
        </div>
      </div>

      <Separator />

      <ViewSection title="Details">
        <ViewField label="Industry" value={capitalize(org.industry)} />
        <ViewField label="Company Size" value={org.size} />
        <ViewField label="Location" value={org.location} />
      </ViewSection>

      {org.peopleCount !== undefined && (
        <>
          <Separator />
          <ViewSection title="People">
            <ViewField
              label="Contacts"
              value={`${org.peopleCount} ${org.peopleCount === 1 ? "person" : "people"}`}
            />
          </ViewSection>
        </>
      )}
    </div>
  );
}

function OrgForm({
  form,
  isPending,
}: {
  form: ReturnType<typeof useForm<CreateOrg>>;
  isPending: boolean;
}) {
  return (
    <Form {...form}>
      <div className="space-y-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Acme Corp" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Domain */}
        <FormField
          control={form.control}
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain</FormLabel>
              <FormControl>
                <Input
                  placeholder="acme.com"
                  {...field}
                  value={field.value ?? ""}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Industry + Size */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <Select
                  value={field.value ?? "__none"}
                  onValueChange={(v) => field.onChange(v === "__none" ? "" : v)}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none">Not specified</SelectItem>
                    {ORG_INDUSTRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Size</FormLabel>
                <Select
                  value={field.value ?? "__none"}
                  onValueChange={(v) => field.onChange(v === "__none" ? "" : v)}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none">Not specified</SelectItem>
                    {ORG_SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input
                  placeholder="San Francisco, CA"
                  {...field}
                  value={field.value ?? ""}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface OrgDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: EntitySheetMode;
  onModeChange: (mode: EntitySheetMode) => void;
  org?: Organization;
}

export function OrgDrawer({ open, onOpenChange, mode, onModeChange, org }: OrgDrawerProps) {
  const { mutate: createOrgMutate, isPending: isCreating } = useCreateOrg();
  const { mutate: updateOrgMutate, isPending: isUpdating } = useUpdateOrg(org?.id ?? "");
  const { mutate: deleteOrgMutate, isPending: isDeleting } = useDeleteOrg();

  const isPending = isCreating || isUpdating || isDeleting;

  const formValues = useMemo<CreateOrg>(
    () => ({
      name: mode === "create" ? "" : (org?.name ?? ""),
      domain: mode === "create" ? "" : (org?.domain ?? ""),
      industry: mode === "create" ? "" : (org?.industry ?? ""),
      size: mode === "create" ? "" : (org?.size ?? ""),
      location: mode === "create" ? "" : (org?.location ?? ""),
    }),
    [mode, org],
  );

  const form = useForm<CreateOrg>({
    resolver: zodResolver(createOrgSchema),
    values: formValues,
  });

  function onSubmit(values: CreateOrg) {
    // Strip empty optional strings to undefined
    const payload: CreateOrg = {
      name: values.name,
      domain: values.domain || undefined,
      industry: values.industry || undefined,
      size: values.size || undefined,
      location: values.location || undefined,
    };

    if (mode === "create") {
      createOrgMutate(payload, { onSuccess: () => onOpenChange(false) });
    } else {
      updateOrgMutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  }

  function handleDelete() {
    if (!org) return;
    deleteOrgMutate(org.id, { onSuccess: () => onOpenChange(false) });
  }

  const title =
    mode === "create"
      ? "New Organization"
      : mode === "edit"
        ? "Edit Organization"
        : (org?.name ?? "Organization");

  const description =
    mode === "create"
      ? "Add a new organization to your CRM."
      : mode === "edit"
        ? "Update the organization's information."
        : (org?.domain ?? undefined);

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      mode={mode}
      isSaving={isPending}
      onEdit={mode === "view" ? () => onModeChange("edit") : undefined}
      onSave={mode !== "view" ? form.handleSubmit(onSubmit) : undefined}
      onDelete={mode === "view" && org ? handleDelete : undefined}
      deleteLabel={isDeleting ? "Deleting…" : "Delete"}
    >
      {mode === "view" && org ? (
        <ViewContent org={org} />
      ) : (
        <OrgForm form={form} isPending={isPending} />
      )}
    </EntitySheet>
  );
}
