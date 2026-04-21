"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPersonSchema, type CreatePerson } from "@workspace/validators/schemas/crm";
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
import { Badge } from "@workspace/ui/components/ui/badge";
import { cn } from "@workspace/ui/lib/utils";
import { EntitySheet, type EntitySheetMode } from "@/components/shared/entity-sheet";
import { CrmViewField, CrmViewSection } from "@/components/crm/crm-view";
import { useCreatePerson, useUpdatePerson, useDeletePerson } from "@/hooks/queries/use-people";
import { useOrganizations } from "@/hooks/queries/use-orgs";
import { useActiveWorkspace } from "@/hooks/queries/use-workspace";
import type { CustomFieldDefinition, Person } from "@/types/crm";
import type { WorkspaceMember } from "@/types/workspace-settings";
import { PERSON_STATUS_OPTIONS } from "@/components/crm/crm-options";
import {
  buildCustomFieldsPayload,
  formatCustomFieldValueForView,
  toDateTimeInputValue,
} from "@/lib/crm-custom-fields";

// ─── View content ─────────────────────────────────────────────────────────────

function PersonViewContent({
  person,
  customFields,
}: {
  person: Person;
  customFields: CustomFieldDefinition[];
}) {
  const statusConfig = PERSON_STATUS_OPTIONS.find((option) => option.value === person.status);
  const orgName = person.orgName ?? person.org?.name;
  const ownerName = person.ownerName ?? person.owner?.name;

  return (
    <div className="space-y-6 py-2">
      <CrmViewSection title="Contact">
        <CrmViewField label="Full Name">
          <span className="font-medium">{person.name}</span>
        </CrmViewField>
        <CrmViewField label="Email">
          {person.email ? (
            <a
              href={`mailto:${person.email}`}
              className="text-primary hover:underline underline-offset-4"
            >
              {person.email}
            </a>
          ) : (
            <span className="text-muted-foreground/50">Not provided</span>
          )}
        </CrmViewField>
        <CrmViewField label="Phone">
          {person.phone ? (
            <a
              href={`tel:${person.phone}`}
              className="text-primary hover:underline underline-offset-4"
            >
              {person.phone}
            </a>
          ) : (
            <span className="text-muted-foreground/50">Not provided</span>
          )}
        </CrmViewField>
        {person.linkedinUrl && (
          <CrmViewField label="LinkedIn">
            <a
              href={person.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline underline-offset-4 truncate block"
            >
              {person.linkedinUrl}
            </a>
          </CrmViewField>
        )}
      </CrmViewSection>

      <Separator />

      <CrmViewSection title="Profile">
        <CrmViewField label="Job Title">
          {person.jobTitle ?? <span className="text-muted-foreground/50">Not set</span>}
        </CrmViewField>
        <CrmViewField label="Status">
          {statusConfig ? (
            <Badge className={cn("font-medium", statusConfig.badgeClassName)}>
              {statusConfig.label}
            </Badge>
          ) : null}
        </CrmViewField>
        <CrmViewField label="Source">
          <span className="capitalize">{person.source}</span>
        </CrmViewField>
        <CrmViewField label="Last Contacted">
          <span className="text-muted-foreground">
            {person.lastContactedAt ? dayjs(person.lastContactedAt).format("MMMM D, YYYY") : "—"}
          </span>
        </CrmViewField>
      </CrmViewSection>

      <Separator />

      <CrmViewSection title="Assignment">
        <CrmViewField label="Organization">
          {orgName ?? <span className="text-muted-foreground/50">Not assigned</span>}
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
                {formatCustomFieldValueForView(field, person.customFields?.[field.id])}
              </CrmViewField>
            ))}
          </CrmViewSection>
        </>
      )}

      <div className="pt-2 border-t border-dashed">
        <div className="grid grid-cols-2 gap-4">
          <CrmViewField label="Created">
            <span className="text-muted-foreground">
              {dayjs(person.createdAt).format("MMMM D, YYYY")}
            </span>
          </CrmViewField>
          <CrmViewField label="Updated">
            <span className="text-muted-foreground">
              {dayjs(person.updatedAt).format("MMMM D, YYYY")}
            </span>
          </CrmViewField>
        </div>
      </div>
    </div>
  );
}

// ─── Form content ─────────────────────────────────────────────────────────────

function PersonForm({
  form,
  isPending,
  customFields,
}: {
  form: ReturnType<typeof useForm<CreatePerson>>;
  isPending: boolean;
  customFields: CustomFieldDefinition[];
}) {
  const { data: orgsData } = useOrganizations({ pageSize: 100 });
  const { data: workspace } = useActiveWorkspace();

  const orgs = orgsData?.orgs ?? [];
  const members = (workspace?.members ?? []) as Pick<WorkspaceMember, "userId" | "user">[];

  return (
    <Form {...form}>
      <div className="space-y-4 py-2">
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
                <Input placeholder="Jane Smith" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email + Phone */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="jane@example.com"
                    {...field}
                    value={field.value ?? ""}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+1 555 0100"
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

        {/* Job Title */}
        <FormField
          control={form.control}
          name="jobTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Senior Engineer"
                  {...field}
                  value={field.value ?? ""}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status + Source */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  value={field.value ?? "lead"}
                  onValueChange={field.onChange}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PERSON_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Organization */}
        <FormField
          control={form.control}
          name="orgId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization</FormLabel>
              <Select
                value={field.value ?? "__none"}
                onValueChange={(v) => field.onChange(v === "__none" ? null : v)}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No organization" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none">No organization</SelectItem>
                  {orgs.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        {/* LinkedIn */}
        <FormField
          control={form.control}
          name="linkedinUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://linkedin.com/in/janesmith"
                  {...field}
                  value={field.value ?? ""}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Contacted */}
        <FormField
          control={form.control}
          name="lastContactedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Contacted</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value ? dayjs(field.value).format("YYYY-MM-DD") : ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? dayjs(e.target.value, "YYYY-MM-DD").toDate() : undefined,
                    )
                  }
                  disabled={isPending}
                />
              </FormControl>
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

// ─── Main drawer ──────────────────────────────────────────────────────────────

interface PeopleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: EntitySheetMode;
  onModeChange: (mode: EntitySheetMode) => void;
  person?: Person | null;
  customFields?: CustomFieldDefinition[];
  onDeleteSuccess?: () => void;
}

export function PeopleDrawer({
  open,
  onOpenChange,
  mode,
  onModeChange,
  person,
  customFields = [],
  onDeleteSuccess,
}: PeopleDrawerProps) {
  const { mutate: createPerson, isPending: isCreating } = useCreatePerson();
  const { mutate: updatePerson, isPending: isUpdating } = useUpdatePerson(person?.id ?? "");
  const { mutate: deletePerson, isPending: isDeleting } = useDeletePerson();

  const isSaving = isCreating || isUpdating || isDeleting;

  const formValues = useMemo<CreatePerson>(
    () => ({
      name: mode === "create" ? "" : (person?.name ?? ""),
      email: mode === "create" ? undefined : (person?.email ?? undefined),
      phone: mode === "create" ? undefined : (person?.phone ?? undefined),
      jobTitle: mode === "create" ? undefined : (person?.jobTitle ?? undefined),
      linkedinUrl: mode === "create" ? undefined : (person?.linkedinUrl ?? undefined),
      status: mode === "create" ? "lead" : (person?.status ?? "lead"),
      source: mode === "create" ? "manual" : (person?.source ?? "manual"),
      orgId: mode === "create" ? null : (person?.orgId ?? null),
      ownerId: mode === "create" ? null : (person?.ownerId ?? null),
      lastContactedAt:
        mode === "create"
          ? undefined
          : person?.lastContactedAt
            ? dayjs(person.lastContactedAt).toDate()
            : undefined,
      customFields: mode === "create" ? undefined : (person?.customFields ?? undefined),
    }),
    [mode, person],
  );

  const form = useForm<CreatePerson>({
    resolver: zodResolver(createPersonSchema),
    values: formValues,
  });

  function onSubmit(values: CreatePerson) {
    const payload: CreatePerson = {
      ...values,
      email: values.email || undefined,
      phone: values.phone || undefined,
      jobTitle: values.jobTitle || undefined,
      linkedinUrl: values.linkedinUrl || undefined,
      customFields: buildCustomFieldsPayload(
        customFields,
        (values.customFields ?? {}) as Record<string, unknown>,
      ),
    };

    if (mode === "create") {
      createPerson(payload, { onSuccess: () => onOpenChange(false) });
    } else {
      updatePerson(payload, { onSuccess: () => onOpenChange(false) });
    }
  }

  function handleDelete() {
    if (!person) return;
    deletePerson(person.id, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleteSuccess?.();
      },
    });
  }

  const title =
    mode === "create"
      ? "New Person"
      : mode === "edit"
        ? `Edit — ${person?.name ?? "Person"}`
        : (person?.name ?? "Person");

  const description =
    mode === "create"
      ? "Add a new person to your CRM."
      : mode === "edit"
        ? "Update the details for this person."
        : undefined;

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      mode={mode}
      isSaving={isSaving}
      onEdit={person ? () => onModeChange("edit") : undefined}
      onSave={form.handleSubmit(onSubmit)}
      onDelete={mode !== "create" && person ? handleDelete : undefined}
    >
      {mode === "view" && person ? (
        <PersonViewContent person={person} customFields={customFields} />
      ) : (
        <PersonForm form={form} isPending={isSaving} customFields={customFields} />
      )}
    </EntitySheet>
  );
}
