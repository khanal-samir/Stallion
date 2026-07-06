"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowUpRight, Building2, Check, Globe2, Pencil, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { createOrgSchema, type CreateOrg } from "@workspace/validators/schemas/crm";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Button } from "@workspace/ui/components/ui/button";
import {
  CrmDossierMetric,
  CrmDossierRow,
  CrmDossierSection,
  CrmRecordPanel,
  CrmRecordShell,
  EmptyRecordValue,
} from "@/components/crm/crm-record-detail";
import { OrgForm } from "@/components/crm/org/org-drawer";
import { ORG_INDUSTRY_OPTIONS } from "@/components/crm/crm-options";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { NotFoundState } from "@/components/shared/not-found-state";
import { useOrgCustomFields } from "@/hooks/queries/use-crm-custom-fields";
import { useOrg, useUpdateOrg } from "@/hooks/queries/use-org";
import { buildCustomFieldsPayload, formatCustomFieldValueForView } from "@/lib/crm-custom-fields";
import type { CustomFieldDefinition, Organization } from "@/types/crm";

function cleanOrgPayload(values: CreateOrg, customFields: CustomFieldDefinition[]): CreateOrg {
  return {
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
}

function orgFormValues(org: Organization): CreateOrg {
  return {
    name: org.name,
    domain: org.domain ?? "",
    industry: org.industry ?? "",
    size: org.size ?? "",
    location: org.location ?? "",
    ownerId: org.ownerId ?? null,
    customFields: org.customFields ?? undefined,
  };
}

function getIndustryLabel(industry: string | null) {
  return ORG_INDUSTRY_OPTIONS.find((option) => option.value === industry)?.label ?? industry;
}

function OrgReadView({
  org,
  customFields,
}: {
  org: Organization;
  customFields: CustomFieldDefinition[];
}) {
  const ownerName = org.ownerName ?? org.owner?.name;
  const peopleCount = org.peopleCount ?? org.people?.length ?? 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-5">
        <CrmDossierSection
          title="Company information"
          description="Primary account fields used by the sales team."
        >
          <CrmDossierRow label="Name">{org.name}</CrmDossierRow>
          <CrmDossierRow label="Domain">
            {org.domain ? (
              <a
                className="inline-flex min-w-0 items-center gap-2 text-primary hover:underline"
                href={`https://${org.domain}`}
                target="_blank"
                rel="noreferrer"
              >
                <Globe2 className="size-4 shrink-0" />
                <span className="truncate">{org.domain}</span>
              </a>
            ) : (
              <EmptyRecordValue />
            )}
          </CrmDossierRow>
          <CrmDossierRow label="Industry">
            {org.industry ? getIndustryLabel(org.industry) : <EmptyRecordValue />}
          </CrmDossierRow>
          <CrmDossierRow label="Company size">{org.size ?? <EmptyRecordValue />}</CrmDossierRow>
          <CrmDossierRow label="Location">{org.location ?? <EmptyRecordValue />}</CrmDossierRow>
          <CrmDossierRow label="Owner">
            {ownerName ?? <EmptyRecordValue>Unassigned</EmptyRecordValue>}
          </CrmDossierRow>
        </CrmDossierSection>

        <CrmDossierSection title="People" description="Contacts associated with this organization.">
          {org.people && org.people.length > 0 ? (
            org.people.map((person) => (
              <div key={person.id} className="px-5 py-3.5">
                <Link
                  href={`/people/${person.id}`}
                  className="group flex items-center justify-between gap-4 text-sm font-medium text-foreground"
                >
                  <span className="truncate">{person.name}</span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </Link>
              </div>
            ))
          ) : (
            <div className="px-5 py-4 text-sm text-muted-foreground">
              {peopleCount > 0
                ? `${peopleCount} ${peopleCount === 1 ? "person is" : "people are"} linked to this organization.`
                : "No people linked yet."}
            </div>
          )}
        </CrmDossierSection>

        <CrmDossierSection
          title="Custom fields"
          description="Workspace-specific qualification data."
        >
          {customFields.length > 0 ? (
            customFields.map((field) => {
              const value = formatCustomFieldValueForView(field, org.customFields?.[field.id]);
              return (
                <CrmDossierRow key={field.id} label={field.label}>
                  {value === "Not set" ? <EmptyRecordValue /> : value}
                </CrmDossierRow>
              );
            })
          ) : (
            <div className="px-5 py-4 text-sm text-muted-foreground">
              No organization custom fields have been configured yet.
            </div>
          )}
        </CrmDossierSection>
      </div>

      <aside className="space-y-5">
        <CrmDossierSection title="Record summary">
          <CrmDossierMetric label="People" value={peopleCount.toLocaleString()} />
          <CrmDossierMetric label="Owner" value={ownerName ?? "Unassigned"} />
          <CrmDossierMetric label="Created" value={dayjs(org.createdAt).format("MMM D, YYYY")} />
          <CrmDossierMetric label="Updated" value={dayjs(org.updatedAt).format("MMM D, YYYY")} />
        </CrmDossierSection>
      </aside>
    </div>
  );
}

export function OrgDetailPage({
  orgId,
  startInEditMode = false,
}: {
  orgId: string;
  startInEditMode?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const { data: org, isLoading, isError, refetch } = useOrg(orgId);
  const { data: customFieldsData } = useOrgCustomFields();
  const customFields = (customFieldsData ?? []) as CustomFieldDefinition[];
  const { mutate: updateOrg, isPending: isUpdating } = useUpdateOrg(orgId);

  const values = useMemo(() => (org ? orgFormValues(org) : undefined), [org]);
  const form = useForm<CreateOrg>({
    resolver: zodResolver(createOrgSchema),
    values,
  });

  function onSubmit(formValues: CreateOrg) {
    updateOrg(cleanOrgPayload(formValues, customFields), {
      onSuccess: () => setIsEditing(false),
    });
  }

  if (isLoading) {
    return <LoadingState variant="page" text="Loading organization profile..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load organization"
        description="There was a problem fetching this organization."
        onRetry={refetch}
        className="min-h-[60vh]"
      />
    );
  }

  if (!org) {
    return (
      <NotFoundState
        title="Organization not found"
        description="This organization does not exist or has been removed."
        backHref="/organizations"
        backLabel="Back to organizations"
      />
    );
  }

  const ownerName = org.ownerName ?? org.owner?.name;

  return (
    <CrmRecordShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/organizations">
            <ArrowLeft className="size-4" />
            Organizations
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
                <Building2 className="size-3.5" />
                Organization
              </Badge>
              {org.industry ? (
                <Badge className="rounded-full">{getIndustryLabel(org.industry)}</Badge>
              ) : null}
            </div>
            <h1 className="truncate text-3xl font-semibold tracking-tight text-foreground">
              {org.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {org.domain ?? "No domain captured"} · {ownerName ?? "No owner assigned"}
            </p>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-3 lg:min-w-[30rem]">
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">People</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {(org.peopleCount ?? org.people?.length ?? 0).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Size</dt>
              <dd className="mt-1 font-semibold text-foreground">{org.size ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Updated</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {dayjs(org.updatedAt).format("MMM D, YYYY")}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {isEditing ? (
        <CrmRecordPanel title="Edit Organization" eyebrow="Update record">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <OrgForm form={form} isPending={isUpdating} customFields={customFields} />
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
        <OrgReadView org={org} customFields={customFields} />
      )}
    </CrmRecordShell>
  );
}
