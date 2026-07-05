"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Check,
  Linkedin,
  Mail,
  Pencil,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { createPersonSchema, type CreatePerson } from "@workspace/validators/schemas/crm";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Button } from "@workspace/ui/components/ui/button";
import { Separator } from "@workspace/ui/components/ui/separator";
import { cn } from "@workspace/ui/lib/utils";
import {
  CrmRecordField,
  CrmRecordPanel,
  CrmRecordShell,
  CrmRecordStat,
  EmptyRecordValue,
} from "@/components/crm/crm-record-detail";
import { PERSON_SOURCE_OPTIONS, PERSON_STATUS_OPTIONS } from "@/components/crm/crm-options";
import { PersonForm } from "@/components/crm/people/people-drawer";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { NotFoundState } from "@/components/shared/not-found-state";
import { usePeopleCustomFields } from "@/hooks/queries/use-crm-custom-fields";
import { usePerson, useUpdatePerson } from "@/hooks/queries/use-people";
import { buildCustomFieldsPayload, formatCustomFieldValueForView } from "@/lib/crm-custom-fields";
import type { CustomFieldDefinition, Person } from "@/types/crm";

function cleanPersonPayload(
  values: CreatePerson,
  customFields: CustomFieldDefinition[],
): CreatePerson {
  return {
    ...values,
    email: values.email || undefined,
    phone: values.phone || undefined,
    jobTitle: values.jobTitle || undefined,
    linkedinUrl: values.linkedinUrl || undefined,
    orgId: values.orgId ?? null,
    ownerId: values.ownerId ?? null,
    customFields: buildCustomFieldsPayload(
      customFields,
      (values.customFields ?? {}) as Record<string, unknown>,
    ),
  };
}

function personFormValues(person: Person): CreatePerson {
  return {
    name: person.name,
    email: person.email ?? undefined,
    phone: person.phone ?? undefined,
    jobTitle: person.jobTitle ?? undefined,
    linkedinUrl: person.linkedinUrl ?? undefined,
    status: person.status,
    source: person.source,
    orgId: person.orgId ?? null,
    ownerId: person.ownerId ?? null,
    lastContactedAt: person.lastContactedAt ? dayjs(person.lastContactedAt).toDate() : undefined,
    customFields: person.customFields ?? undefined,
  };
}

function PersonReadView({
  person,
  customFields,
}: {
  person: Person;
  customFields: CustomFieldDefinition[];
}) {
  const status = PERSON_STATUS_OPTIONS.find((option) => option.value === person.status);
  const source = PERSON_SOURCE_OPTIONS.find((option) => option.value === person.source);
  const orgName = person.orgName ?? person.org?.name;
  const ownerName = person.ownerName ?? person.owner?.name;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <CrmRecordPanel title="Contact Details" eyebrow="Primary information">
          <div className="grid gap-3 sm:grid-cols-2">
            <CrmRecordField label="Full Name">{person.name}</CrmRecordField>
            <CrmRecordField label="Job Title">
              {person.jobTitle ?? <EmptyRecordValue />}
            </CrmRecordField>
            <CrmRecordField label="Email">
              {person.email ? (
                <a
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                  href={`mailto:${person.email}`}
                >
                  <Mail className="size-4" />
                  {person.email}
                </a>
              ) : (
                <EmptyRecordValue />
              )}
            </CrmRecordField>
            <CrmRecordField label="Phone">
              {person.phone ? (
                <a
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                  href={`tel:${person.phone}`}
                >
                  <Phone className="size-4" />
                  {person.phone}
                </a>
              ) : (
                <EmptyRecordValue />
              )}
            </CrmRecordField>
            <CrmRecordField label="LinkedIn" className="sm:col-span-2">
              {person.linkedinUrl ? (
                <a
                  className="inline-flex max-w-full items-center gap-2 truncate text-primary hover:underline"
                  href={person.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Linkedin className="size-4 shrink-0" />
                  <span className="truncate">{person.linkedinUrl}</span>
                </a>
              ) : (
                <EmptyRecordValue />
              )}
            </CrmRecordField>
          </div>
        </CrmRecordPanel>

        <CrmRecordPanel title="CRM Classification" eyebrow="Pipeline context">
          <div className="grid gap-3 sm:grid-cols-2">
            <CrmRecordField label="Status">
              {status ? (
                <Badge className={cn("font-medium", status.badgeClassName)}>{status.label}</Badge>
              ) : (
                <EmptyRecordValue />
              )}
            </CrmRecordField>
            <CrmRecordField label="Source">{source?.label ?? person.source}</CrmRecordField>
            <CrmRecordField label="Organization">
              {orgName ? (
                <span className="inline-flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  {orgName}
                </span>
              ) : (
                <EmptyRecordValue>Not linked</EmptyRecordValue>
              )}
            </CrmRecordField>
            <CrmRecordField label="Owner">
              {ownerName ?? <EmptyRecordValue>Unassigned</EmptyRecordValue>}
            </CrmRecordField>
          </div>
        </CrmRecordPanel>

        <CrmRecordPanel title="Custom Intelligence" eyebrow="Workspace fields">
          {customFields.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {customFields.map((field) => {
                const value = formatCustomFieldValueForView(field, person.customFields?.[field.id]);
                return (
                  <CrmRecordField key={field.id} label={field.label}>
                    {value === "Not set" ? <EmptyRecordValue /> : value}
                  </CrmRecordField>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              No people custom fields have been configured yet.
            </p>
          )}
        </CrmRecordPanel>
      </div>

      <aside className="space-y-4">
        <CrmRecordStat
          label="Last Contacted"
          value={
            person.lastContactedAt ? dayjs(person.lastContactedAt).format("MMM D") : "No touch"
          }
          detail={
            person.lastContactedAt
              ? dayjs(person.lastContactedAt).format("YYYY")
              : "No activity date captured"
          }
          tone="accent"
        />
        <CrmRecordStat
          label="Status"
          value={status?.label ?? person.status}
          detail="Relationship stage"
        />
        <CrmRecordStat
          label="Owner"
          value={ownerName ?? "Unassigned"}
          detail="Responsible teammate"
        />
        <CrmRecordPanel title="Timeline" eyebrow="Audit trail" className="rounded-[1.5rem]">
          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <CalendarClock className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-medium">Created</p>
                <p className="text-muted-foreground">
                  {dayjs(person.createdAt).format("MMMM D, YYYY h:mm A")}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Check className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-medium">Updated</p>
                <p className="text-muted-foreground">
                  {dayjs(person.updatedAt).format("MMMM D, YYYY h:mm A")}
                </p>
              </div>
            </div>
          </div>
        </CrmRecordPanel>
      </aside>
    </div>
  );
}

export function PersonDetailPage({
  personId,
  startInEditMode = false,
}: {
  personId: string;
  startInEditMode?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const { data: person, isLoading, isError, refetch } = usePerson(personId);
  const { data: customFieldsData } = usePeopleCustomFields();
  const customFields = (customFieldsData ?? []) as CustomFieldDefinition[];
  const { mutate: updatePerson, isPending: isUpdating } = useUpdatePerson(personId);

  const values = useMemo(() => (person ? personFormValues(person) : undefined), [person]);
  const form = useForm<CreatePerson>({
    resolver: zodResolver(createPersonSchema),
    values,
  });

  function onSubmit(formValues: CreatePerson) {
    updatePerson(cleanPersonPayload(formValues, customFields), {
      onSuccess: () => setIsEditing(false),
    });
  }

  if (isLoading) {
    return <LoadingState variant="page" text="Loading contact profile..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load person"
        description="There was a problem fetching this contact."
        onRetry={refetch}
        className="min-h-[60vh]"
      />
    );
  }

  if (!person) {
    return (
      <NotFoundState
        title="Person not found"
        description="This person does not exist or has been removed."
        backHref="/people"
        backLabel="Back to people"
      />
    );
  }

  const status = PERSON_STATUS_OPTIONS.find((option) => option.value === person.status);
  const orgName = person.orgName ?? person.org?.name;

  return (
    <CrmRecordShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/people">
            <ArrowLeft className="size-4" />
            People
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
              >
                <X className="size-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={isUpdating}>
                <Check className="size-4" />
                {isUpdating ? "Saving..." : "Save changes"}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-xl">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/30 to-transparent" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <UserRound className="size-8" />
              </div>
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    Contact
                  </Badge>
                  {status ? (
                    <Badge className={cn("rounded-full", status.badgeClassName)}>
                      {status.label}
                    </Badge>
                  ) : null}
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {person.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {person.jobTitle ?? "No job title"}{" "}
                  {orgName ? `• ${orgName}` : "• No organization linked"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-80">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Email
                </p>
                <p className="mt-2 truncate text-sm font-semibold">{person.email ?? "-"}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Role
                </p>
                <p className="mt-2 truncate text-sm font-semibold">{person.jobTitle ?? "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isEditing ? (
        <CrmRecordPanel title="Edit Person" eyebrow="Update record">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <PersonForm form={form} isPending={isUpdating} customFields={customFields} />
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CrmRecordPanel>
      ) : (
        <PersonReadView person={person} customFields={customFields} />
      )}
    </CrmRecordShell>
  );
}
