"use client";

import { useEffect, useState } from "react";
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
import { useCreatePerson, useUpdatePerson, useDeletePerson } from "@/hooks/queries/use-people";
import { useOrganizations } from "@/hooks/queries/use-orgs";
import { useActiveWorkspace } from "@/hooks/queries/use-workspace";
import type { Person } from "@/types/crm";

import { PERSON_STATUS_CONFIG } from "./people-columns";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 10);
}

function getDefaultValues(person?: Person | null): Partial<CreatePerson> {
  return {
    name: person?.name ?? "",
    email: person?.email ?? undefined,
    phone: person?.phone ?? undefined,
    jobTitle: person?.jobTitle ?? undefined,
    linkedinUrl: person?.linkedinUrl ?? undefined,
    status: person?.status ?? "lead",
    source: person?.source ?? "manual",
    orgId: person?.orgId ?? null,
    ownerId: person?.ownerId ?? null,
    lastContactedAt: person?.lastContactedAt ? new Date(person.lastContactedAt) : undefined,
  };
}

// ─── View-mode field helpers ──────────────────────────────────────────────────

function ViewField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {title}
      </p>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

// ─── View content ─────────────────────────────────────────────────────────────

function PersonViewContent({ person }: { person: Person }) {
  const statusConfig = PERSON_STATUS_CONFIG[person.status];
  const orgName = person.orgName ?? person.org?.name;
  const ownerName = person.ownerName ?? person.owner?.name;

  return (
    <div className="space-y-6 py-2">
      <ViewSection title="Contact">
        <ViewField label="Full Name">
          <span className="font-medium">{person.name}</span>
        </ViewField>
        <ViewField label="Email">
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
        </ViewField>
        <ViewField label="Phone">
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
        </ViewField>
        {person.linkedinUrl && (
          <ViewField label="LinkedIn">
            <a
              href={person.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline underline-offset-4 truncate block"
            >
              {person.linkedinUrl}
            </a>
          </ViewField>
        )}
      </ViewSection>

      <Separator />

      <ViewSection title="Profile">
        <ViewField label="Job Title">
          {person.jobTitle ?? <span className="text-muted-foreground/50">Not set</span>}
        </ViewField>
        <ViewField label="Status">
          <Badge className={cn("font-medium", statusConfig.className)}>{statusConfig.label}</Badge>
        </ViewField>
        <ViewField label="Source">
          <span className="capitalize">{person.source}</span>
        </ViewField>
        <ViewField label="Last Contacted">
          <span className="text-muted-foreground">{formatDate(person.lastContactedAt)}</span>
        </ViewField>
      </ViewSection>

      <Separator />

      <ViewSection title="Assignment">
        <ViewField label="Organization">
          {orgName ?? <span className="text-muted-foreground/50">Not assigned</span>}
        </ViewField>
        <ViewField label="Owner">
          {ownerName ?? <span className="text-muted-foreground/50">Not assigned</span>}
        </ViewField>
      </ViewSection>

      <div className="pt-2 border-t border-dashed">
        <div className="grid grid-cols-2 gap-4">
          <ViewField label="Created">
            <span className="text-muted-foreground">{formatDate(person.createdAt)}</span>
          </ViewField>
          <ViewField label="Updated">
            <span className="text-muted-foreground">{formatDate(person.updatedAt)}</span>
          </ViewField>
        </div>
      </div>
    </div>
  );
}

// ─── Form content ─────────────────────────────────────────────────────────────

function PersonForm({
  form,
  isPending,
}: {
  form: ReturnType<typeof useForm<CreatePerson>>;
  isPending: boolean;
}) {
  const { data: orgsData } = useOrganizations({ pageSize: 100 });
  const { data: workspace } = useActiveWorkspace();

  const orgs = orgsData?.orgs ?? [];
  const members =
    (
      workspace as unknown as {
        members?: Array<{ userId: string; user: { name: string } }>;
      }
    )?.members ?? [];

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
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <Select
                  value={field.value ?? "manual"}
                  onValueChange={field.onChange}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="csv">CSV import</SelectItem>
                    <SelectItem value="api">API</SelectItem>
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
                  value={toDateInputValue(field.value as Date | string | undefined)}
                  onChange={(e) =>
                    field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                  }
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

// ─── Main drawer ──────────────────────────────────────────────────────────────

interface PeopleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode: EntitySheetMode;
  person?: Person | null;
  onDeleteSuccess?: () => void;
}

export function PeopleDrawer({
  open,
  onOpenChange,
  initialMode,
  person,
  onDeleteSuccess,
}: PeopleDrawerProps) {
  const [mode, setMode] = useState<EntitySheetMode>(initialMode);

  const { mutate: createPerson, isPending: isCreating } = useCreatePerson();
  const { mutate: updatePerson, isPending: isUpdating } = useUpdatePerson(person?.id ?? "");
  const { mutate: deletePerson, isPending: isDeleting } = useDeletePerson();

  const isSaving = isCreating || isUpdating || isDeleting;

  const form = useForm<CreatePerson>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: getDefaultValues(person),
  });

  // Reset form and mode every time the drawer opens
  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    form.reset(getDefaultValues(initialMode === "create" ? null : person));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, person?.id, initialMode]);

  function onSubmit(values: CreatePerson) {
    const payload: CreatePerson = {
      ...values,
      email: values.email || undefined,
      phone: values.phone || undefined,
      jobTitle: values.jobTitle || undefined,
      linkedinUrl: values.linkedinUrl || undefined,
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
      onEdit={person ? () => setMode("edit") : undefined}
      onSave={form.handleSubmit(onSubmit)}
      onDelete={mode !== "create" && person ? handleDelete : undefined}
    >
      {mode === "view" && person ? (
        <PersonViewContent person={person} />
      ) : (
        <PersonForm form={form} isPending={isSaving} />
      )}
    </EntitySheet>
  );
}
