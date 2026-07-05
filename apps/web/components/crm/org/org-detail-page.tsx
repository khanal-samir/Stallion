"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, CalendarClock, Check, Globe2, Pencil, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { createOrgSchema, type CreateOrg } from "@workspace/validators/schemas/crm";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Button } from "@workspace/ui/components/ui/button";
import { Separator } from "@workspace/ui/components/ui/separator";
import {
  CrmRecordField,
  CrmRecordPanel,
  CrmRecordShell,
  CrmRecordStat,
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <CrmRecordPanel title="Company Profile" eyebrow="Core record">
          <div className="grid gap-3 sm:grid-cols-2">
            <CrmRecordField label="Organization Name">{org.name}</CrmRecordField>
            <CrmRecordField label="Domain">
              {org.domain ? (
                <a
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                  href={`https://${org.domain}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe2 className="size-4" />
                  {org.domain}
                </a>
              ) : (
                <EmptyRecordValue />
              )}
            </CrmRecordField>
            <CrmRecordField label="Industry">
              {org.industry ? getIndustryLabel(org.industry) : <EmptyRecordValue />}
            </CrmRecordField>
            <CrmRecordField label="Company Size">{org.size ?? <EmptyRecordValue />}</CrmRecordField>
            <CrmRecordField label="Location" className="sm:col-span-2">
              {org.location ?? <EmptyRecordValue />}
            </CrmRecordField>
          </div>
        </CrmRecordPanel>

        <CrmRecordPanel title="Custom Intelligence" eyebrow="Workspace fields">
          {customFields.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {customFields.map((field) => {
                const value = formatCustomFieldValueForView(field, org.customFields?.[field.id]);
                return (
                  <CrmRecordField key={field.id} label={field.label}>
                    {value === "Not set" ? <EmptyRecordValue /> : value}
                  </CrmRecordField>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              No organization custom fields have been configured yet.
            </p>
          )}
        </CrmRecordPanel>
      </div>

      <aside className="space-y-4">
        <CrmRecordStat
          label="Contacts"
          value={peopleCount}
          detail={`${peopleCount === 1 ? "person" : "people"} linked to this company`}
          tone="accent"
        />
        <CrmRecordStat
          label="Owner"
          value={ownerName ?? "Unassigned"}
          detail="Responsible teammate"
        />
        <CrmRecordStat
          label="Last Updated"
          value={dayjs(org.updatedAt).format("MMM D")}
          detail={dayjs(org.updatedAt).format("YYYY, h:mm A")}
        />
        <CrmRecordPanel title="Timeline" eyebrow="Audit trail" className="rounded-[1.5rem]">
          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <CalendarClock className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-medium">Created</p>
                <p className="text-muted-foreground">
                  {dayjs(org.createdAt).format("MMMM D, YYYY h:mm A")}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Check className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-medium">Record refreshed</p>
                <p className="text-muted-foreground">
                  {dayjs(org.updatedAt).format("MMMM D, YYYY h:mm A")}
                </p>
              </div>
            </div>
          </div>
        </CrmRecordPanel>
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

      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-xl">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/30 to-transparent" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Building2 className="size-8" />
              </div>
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    Organization
                  </Badge>
                  {org.industry ? (
                    <Badge className="rounded-full">{getIndustryLabel(org.industry)}</Badge>
                  ) : null}
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {org.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {org.domain ?? "No domain captured"}{" "}
                  {ownerName ? `• Owned by ${ownerName}` : "• No owner assigned"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-80">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  People
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {org.peopleCount ?? org.people?.length ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Size
                </p>
                <p className="mt-2 text-2xl font-semibold">{org.size ?? "-"}</p>
              </div>
            </div>
          </div>
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
