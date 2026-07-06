"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  Linkedin,
  Mail,
  Pencil,
  Phone,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { createPersonSchema, type CreatePerson } from "@workspace/validators/schemas/crm";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Button } from "@workspace/ui/components/ui/button";
import { cn } from "@workspace/ui/lib/utils";
import {
  CrmDossierMetric,
  CrmDossierRow,
  CrmDossierSection,
  CrmRecordPanel,
  CrmRecordShell,
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
  const orgId = person.org?.id ?? person.orgId;
  const ownerName = person.ownerName ?? person.owner?.name;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-5">
        <CrmDossierSection
          title="Contact information"
          description="Direct contact details and role context."
        >
          <CrmDossierRow label="Name">{person.name}</CrmDossierRow>
          <CrmDossierRow label="Email">
            {person.email ? (
              <a
                className="inline-flex min-w-0 items-center gap-2 text-primary hover:underline"
                href={`mailto:${person.email}`}
              >
                <Mail className="size-4 shrink-0" />
                <span className="truncate">{person.email}</span>
              </a>
            ) : (
              <EmptyRecordValue />
            )}
          </CrmDossierRow>
          <CrmDossierRow label="Phone">
            {person.phone ? (
              <a
                className="inline-flex items-center gap-2 text-primary hover:underline"
                href={`tel:${person.phone}`}
              >
                <Phone className="size-4 shrink-0" />
                {person.phone}
              </a>
            ) : (
              <EmptyRecordValue />
            )}
          </CrmDossierRow>
          <CrmDossierRow label="Job title">{person.jobTitle ?? <EmptyRecordValue />}</CrmDossierRow>
          <CrmDossierRow label="LinkedIn">
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
          </CrmDossierRow>
        </CrmDossierSection>

        <CrmDossierSection
          title="CRM classification"
          description="Lifecycle, source, and relationship ownership."
        >
          <CrmDossierRow label="Status">
            {status ? (
              <Badge className={cn("font-medium", status.badgeClassName)}>{status.label}</Badge>
            ) : (
              <EmptyRecordValue />
            )}
          </CrmDossierRow>
          <CrmDossierRow label="Source">{source?.label ?? person.source}</CrmDossierRow>
          <CrmDossierRow label="Organization">
            {orgId && orgName ? (
              <Link
                href={`/organizations/${orgId}`}
                className="group inline-flex min-w-0 items-center gap-2 text-primary hover:underline"
              >
                <Building2 className="size-4 shrink-0" />
                <span className="truncate">{orgName}</span>
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </Link>
            ) : (
              <EmptyRecordValue>Not linked</EmptyRecordValue>
            )}
          </CrmDossierRow>
          <CrmDossierRow label="Owner">
            {ownerName ?? <EmptyRecordValue>Unassigned</EmptyRecordValue>}
          </CrmDossierRow>
          <CrmDossierRow label="Last contacted">
            {person.lastContactedAt ? (
              dayjs(person.lastContactedAt).format("MMMM D, YYYY")
            ) : (
              <EmptyRecordValue>No activity date</EmptyRecordValue>
            )}
          </CrmDossierRow>
        </CrmDossierSection>

        <CrmDossierSection
          title="Custom fields"
          description="Workspace-specific qualification data."
        >
          {customFields.length > 0 ? (
            customFields.map((field) => {
              const value = formatCustomFieldValueForView(field, person.customFields?.[field.id]);
              return (
                <CrmDossierRow key={field.id} label={field.label}>
                  {value === "Not set" ? <EmptyRecordValue /> : value}
                </CrmDossierRow>
              );
            })
          ) : (
            <div className="px-5 py-4 text-sm text-muted-foreground">
              No people custom fields have been configured yet.
            </div>
          )}
        </CrmDossierSection>
      </div>

      <aside className="space-y-5">
        <CrmDossierSection title="Record summary">
          <CrmDossierMetric label="Status" value={status?.label ?? person.status} />
          <CrmDossierMetric label="Owner" value={ownerName ?? "Unassigned"} />
          <CrmDossierMetric label="Created" value={dayjs(person.createdAt).format("MMM D, YYYY")} />
          <CrmDossierMetric label="Updated" value={dayjs(person.updatedAt).format("MMM D, YYYY")} />
        </CrmDossierSection>
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

      <section className="border-y border-border/70 bg-card/60 px-5 py-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                Contact
              </Badge>
              {status ? (
                <Badge className={cn("rounded-full", status.badgeClassName)}>{status.label}</Badge>
              ) : null}
            </div>
            <h1 className="truncate text-3xl font-semibold tracking-tight text-foreground">
              {person.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {person.jobTitle ?? "No job title"} · {orgName ?? "No organization linked"}
            </p>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-3 lg:min-w-[30rem]">
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Email</dt>
              <dd className="mt-1 truncate font-semibold text-foreground">
                {person.email ?? "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Source</dt>
              <dd className="mt-1 font-semibold text-foreground capitalize">{person.source}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Updated</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {dayjs(person.updatedAt).format("MMM D, YYYY")}
              </dd>
            </div>
          </dl>
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
