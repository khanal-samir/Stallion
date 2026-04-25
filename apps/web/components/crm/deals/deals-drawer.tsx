"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDealSchema, type CreateDeal } from "@workspace/validators/schemas/crm";
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
import { useCreateDeal, useUpdateDeal, useDeleteDeal } from "@/hooks/queries/use-deals";
import { usePeople } from "@/hooks/queries/use-people";
import { useOrganizations } from "@/hooks/queries/use-org";
import { useActiveWorkspace } from "@/hooks/queries/use-workspace";
import type { Deal } from "@/types/crm";
import type { WorkspaceMember } from "@/types/workspace-settings";
import { DEAL_STAGE_OPTIONS, DEAL_STAGE_MAP } from "@/components/crm/deals/deals-options";

// ─── View content ─────────────────────────────────────────────────────────────

function DealViewContent({ deal }: { deal: Deal }) {
  const stageConfig = DEAL_STAGE_MAP[deal.stage];
  const personName = deal.personName ?? deal.person?.name;
  const orgName = deal.orgName ?? deal.org?.name;
  const ownerName = deal.ownerName ?? deal.owner?.name;

  return (
    <div className="space-y-6 py-2">
      <CrmViewSection title="Deal">
        <CrmViewField label="Title">
          <span className="font-medium">{deal.title}</span>
        </CrmViewField>
        <CrmViewField label="Stage">
          {stageConfig ? (
            <Badge className={cn("font-medium", stageConfig.badgeClassName)}>
              {stageConfig.label}
            </Badge>
          ) : null}
        </CrmViewField>
        <div className="grid grid-cols-2 gap-4">
          <CrmViewField label="Value">
            {deal.value ? (
              <span className="font-medium">
                {deal.value} <span className="text-muted-foreground">{deal.currency}</span>
              </span>
            ) : (
              <span className="text-muted-foreground/50">Not set</span>
            )}
          </CrmViewField>
          <CrmViewField label="Close Date">
            <span className="text-muted-foreground">
              {deal.closeDate ? dayjs(deal.closeDate).format("MMMM D, YYYY") : "—"}
            </span>
          </CrmViewField>
        </div>
      </CrmViewSection>

      <Separator />

      <CrmViewSection title="Associations">
        <CrmViewField label="Contact">
          {personName ?? <span className="text-muted-foreground/50">Not linked</span>}
        </CrmViewField>
        <CrmViewField label="Organization">
          {orgName ?? <span className="text-muted-foreground/50">Not linked</span>}
        </CrmViewField>
        <CrmViewField label="Owner">
          {ownerName ?? <span className="text-muted-foreground/50">Not assigned</span>}
        </CrmViewField>
      </CrmViewSection>

      <div className="pt-2 border-t border-dashed">
        <div className="grid grid-cols-2 gap-4">
          <CrmViewField label="Created">
            <span className="text-muted-foreground">
              {dayjs(deal.createdAt).format("MMMM D, YYYY")}
            </span>
          </CrmViewField>
          <CrmViewField label="Updated">
            <span className="text-muted-foreground">
              {dayjs(deal.updatedAt).format("MMMM D, YYYY")}
            </span>
          </CrmViewField>
        </div>
      </div>
    </div>
  );
}

// ─── Form content ─────────────────────────────────────────────────────────────

function DealForm({
  form,
  isPending,
}: {
  form: ReturnType<typeof useForm<CreateDeal>>;
  isPending: boolean;
}) {
  const { data: peopleData } = usePeople({ pageSize: 100 });
  const { data: orgData } = useOrganizations({ pageSize: 100 });
  const { data: workspace } = useActiveWorkspace();

  const people = peopleData?.people ?? [];
  const org = orgData?.org ?? [];
  const members = (workspace?.members ?? []) as Pick<WorkspaceMember, "userId" | "user">[];

  return (
    <Form {...form}>
      <div className="space-y-4 py-2">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Title <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Acme Corp - Enterprise Plan"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Stage */}
        <FormField
          control={form.control}
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stage</FormLabel>
              <Select
                value={field.value ?? "new"}
                onValueChange={field.onChange}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DEAL_STAGE_OPTIONS.map((option) => (
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

        {/* Value + Currency */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="10000"
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
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input
                    placeholder="USD"
                    maxLength={3}
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

        {/* Close Date */}
        <FormField
          control={form.control}
          name="closeDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Close Date</FormLabel>
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

        {/* Contact */}
        <FormField
          control={form.control}
          name="personId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact</FormLabel>
              <Select
                value={field.value ?? "__none"}
                onValueChange={(v) => field.onChange(v === "__none" ? null : v)}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No contact" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none">No contact</SelectItem>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  {org.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
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
      </div>
    </Form>
  );
}

// ─── Main drawer ──────────────────────────────────────────────────────────────

interface DealsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: EntitySheetMode;
  onModeChange: (mode: EntitySheetMode) => void;
  deal?: Deal | null;
  initialStage?: string;
  onDeleteSuccess?: () => void;
}

export function DealsDrawer({
  open,
  onOpenChange,
  mode,
  onModeChange,
  deal,
  initialStage,
  onDeleteSuccess,
}: DealsDrawerProps) {
  const { mutate: createDeal, isPending: isCreating } = useCreateDeal();
  const { mutate: updateDeal, isPending: isUpdating } = useUpdateDeal();
  const { mutate: deleteDeal, isPending: isDeleting } = useDeleteDeal();

  const isSaving = isCreating || isUpdating || isDeleting;

  const formValues = useMemo<CreateDeal>(
    () => ({
      title: mode === "create" ? "" : (deal?.title ?? ""),
      stage:
        mode === "create"
          ? ((initialStage as CreateDeal["stage"]) ?? "new")
          : (deal?.stage ?? "new"),
      value: mode === "create" ? undefined : (deal?.value ?? undefined),
      currency: mode === "create" ? "USD" : (deal?.currency ?? "USD"),
      closeDate:
        mode === "create"
          ? undefined
          : deal?.closeDate
            ? dayjs(deal.closeDate).toDate()
            : undefined,
      personId: mode === "create" ? null : (deal?.personId ?? null),
      orgId: mode === "create" ? null : (deal?.orgId ?? null),
      ownerId: mode === "create" ? null : (deal?.ownerId ?? null),
    }),
    [mode, deal, initialStage],
  );

  const form = useForm<CreateDeal>({
    resolver: zodResolver(createDealSchema),
    values: formValues,
  });

  function onSubmit(values: CreateDeal) {
    const payload: CreateDeal = {
      ...values,
      value: values.value || undefined,
      currency: values.currency || "USD",
    };

    if (mode === "create") {
      createDeal(payload, { onSuccess: () => onOpenChange(false) });
    } else if (deal) {
      updateDeal({ dealId: deal.id, input: payload }, { onSuccess: () => onOpenChange(false) });
    }
  }

  function handleDelete() {
    if (!deal) return;
    deleteDeal(deal.id, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleteSuccess?.();
      },
    });
  }

  const title =
    mode === "create"
      ? "New Deal"
      : mode === "edit"
        ? `Edit — ${deal?.title ?? "Deal"}`
        : (deal?.title ?? "Deal");

  const description =
    mode === "create"
      ? "Add a new deal to your pipeline."
      : mode === "edit"
        ? "Update the details for this deal."
        : undefined;

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      mode={mode}
      isSaving={isSaving}
      onEdit={deal ? () => onModeChange("edit") : undefined}
      onSave={form.handleSubmit(onSubmit)}
      onDelete={mode !== "create" && deal ? handleDelete : undefined}
    >
      {mode === "view" && deal ? (
        <DealViewContent deal={deal} />
      ) : (
        <DealForm form={form} isPending={isSaving} />
      )}
    </EntitySheet>
  );
}
