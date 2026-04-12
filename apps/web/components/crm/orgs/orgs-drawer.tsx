"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrgSchema, updateOrgSchema } from "@workspace/validators/schemas/crm";
import type { CreateOrg, UpdateOrg } from "@workspace/validators/schemas/crm";
import type { Org } from "@/services/orgs.service";
import type { EntitySheetMode } from "@/components/shared/entity-sheet";
import { EntitySheet } from "@/components/shared/entity-sheet";
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

interface OrgsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: EntitySheetMode;
  org?: Org | null;
  isLoading?: boolean;
  onSubmit: (data: CreateOrg | UpdateOrg) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function OrgsDrawer({
  open,
  onOpenChange,
  mode,
  org,
  isLoading,
  onSubmit,
  onEdit,
  onDelete,
}: OrgsDrawerProps) {
  const isCreate = mode === "create";
  const isView = mode === "view";
  const schema = isCreate ? createOrgSchema : updateOrgSchema;

  const form = useForm<CreateOrg>({
    resolver: zodResolver(schema as typeof createOrgSchema),
    defaultValues: isCreate
      ? { name: "", domain: undefined, industry: undefined, size: undefined, location: undefined }
      : org
        ? {
            name: org.name,
            domain: org.domain ?? undefined,
            industry: org.industry ?? undefined,
            size: org.size ?? undefined,
            location: org.location ?? undefined,
          }
        : {},
  });

  const handleSubmit = form.handleSubmit((data) => onSubmit(data));

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        isCreate
          ? "Add Organization"
          : mode === "edit"
            ? "Edit Organization"
            : "Organization Details"
      }
      description={
        isCreate
          ? "Create a new organization in your CRM."
          : mode === "edit"
            ? "Update organization information."
            : undefined
      }
      mode={mode}
      isLoading={isLoading}
      onEdit={onEdit}
      onSave={handleSubmit}
      onDelete={onDelete}
      onCancel={() => onOpenChange(false)}
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Organization name" disabled={isView} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example.com"
                      disabled={isView}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="City, Country"
                      disabled={isView}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isView}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
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
                  <FormLabel>Company size</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isView}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-500">201-500</SelectItem>
                      <SelectItem value="500+">500+</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </EntitySheet>
  );
}
