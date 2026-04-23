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
import { CrmViewField, CrmViewSection } from "@/components/crm/crm-view";
import { useCreateOrg, useUpdateOrg, useDeleteOrg } from "@/hooks/queries/use-org";
import { useActiveWorkspace } from "@/hooks/queries/use-workspace";
import { useAuthSession } from "@/hooks/queries/use-auth";
import type { CustomFieldDefinition, Organization } from "@/types/crm";
import type { WorkspaceMember } from "@/types/workspace-settings";
import { ORG_INDUSTRY_OPTIONS, ORG_SIZE_OPTIONS } from "@/components/crm/crm-options";
import {
  buildCustomFieldsPayload,
  formatCustomFieldValueForView,
  toDateTimeInputValue,
} from "@/lib/crm-custom-fields";

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

function ViewContent({
  org,
  customFields,
}: {
  org: Organization;
  customFields: CustomFieldDefinition[];
}) {
  const ownerName = org.ownerName ?? org.owner?.name;

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

      <CrmViewSection title="Details">
        <CrmViewField label="Industry">
          {capitalize(org.industry) ?? <span className="text-muted-foreground/50">Not set</span>}
        </CrmViewField>
        <CrmViewField label="Company Size">
          {org.size ?? <span className="text-muted-foreground/50">Not set</span>}
        </CrmViewField>
        <CrmViewField label="Location">
          {org.location ?? <span className="text-muted-foreground/50">Not set</span>}
        </CrmViewField>
        <CrmViewField label="Owner">
          {ownerName ?? <span className="text-muted-foreground/50">Not assigned</span>}
        </CrmViewField>
      </CrmViewSection>

      {customFields.length > 0 && (
        <>
          <Separator />
          <CrmViewSection title="Custom fields">
            {customFields.map((field) => (
              <CrmViewField key={field.id} label={field.label}>
                {formatCustomFieldValueForView(field, org.customFields?.[field.id])}
              </CrmViewField>
            ))}
          </CrmViewSection>
        </>
      )}

      {org.peopleCount !== undefined && (
        <>
          <Separator />
          <CrmViewSection title="People">
            <CrmViewField label="Contacts">
              {`${org.peopleCount} ${org.peopleCount === 1 ? "person" : "people"}`}
            </CrmViewField>
          </CrmViewSection>
        </>
      )}
    </div>
  );
}

function OrgForm({
  form,
  isPending,
  customFields,
}: {
  form: ReturnType<typeof useForm<CreateOrg>>;
  isPending: boolean;
  customFields: CustomFieldDefinition[];
}) {
  const { data: workspace } = useActiveWorkspace();
  const members = (workspace?.members ?? []) as Pick<WorkspaceMember, "userId" | "user">[];

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

        {/* Owner */}
        <FormField
          control={form.control}
          name="ownerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Owner</FormLabel>
              <Select
                value={field.value ?? "__none"}
                onValueChange={(v) => field.onChange(v === "__none" ? null : v)}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No owner" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none">No owner</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {customFields.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Custom fields
              </p>

              {customFields.map((customField) => {
                const fieldName = `customFields.${customField.id}` as const;

                return (
                  <FormField
                    key={customField.id}
                    control={form.control}
                    name={fieldName}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{customField.label}</FormLabel>
                        <FormControl>
                          {customField.fieldType === "select" ? (
                            <Select
                              value={typeof field.value === "string" ? field.value : "__none"}
                              onValueChange={(value) =>
                                field.onChange(value === "__none" ? undefined : value)
                              }
                              disabled={isPending}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Not set" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none">Not set</SelectItem>
                                {customField.options.map((option) => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : customField.fieldType === "number" ? (
                            <Input
                              type="number"
                              step="any"
                              value={field.value == null ? "" : String(field.value)}
                              onChange={(event) => field.onChange(event.target.value)}
                              disabled={isPending}
                            />
                          ) : customField.fieldType === "dateTime" ? (
                            <Input
                              type="datetime-local"
                              value={toDateTimeInputValue(field.value)}
                              onChange={(event) => field.onChange(event.target.value || undefined)}
                              disabled={isPending}
                            />
                          ) : (
                            <Input
                              maxLength={255}
                              value={typeof field.value === "string" ? field.value : ""}
                              onChange={(event) => field.onChange(event.target.value)}
                              disabled={isPending}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
            </div>
          </>
        )}
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
  customFields?: CustomFieldDefinition[];
}

export function OrgDrawer({
  open,
  onOpenChange,
  mode,
  onModeChange,
  org,
  customFields = [],
}: OrgDrawerProps) {
  const { data: session } = useAuthSession();
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
      ownerId: mode === "create" ? (session?.user?.id ?? null) : (org?.ownerId ?? null),
      customFields: mode === "create" ? undefined : (org?.customFields ?? undefined),
    }),
    [mode, org, session?.user?.id],
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
      ownerId: values.ownerId ?? null,
      customFields: buildCustomFieldsPayload(
        customFields,
        (values.customFields ?? {}) as Record<string, unknown>,
      ),
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
        <ViewContent org={org} customFields={customFields} />
      ) : (
        <OrgForm form={form} isPending={isPending} customFields={customFields} />
      )}
    </EntitySheet>
  );
}
