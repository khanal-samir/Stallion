"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPersonSchema, updatePersonSchema } from "@workspace/validators/schemas/crm";
import type { CreatePerson, UpdatePerson } from "@workspace/validators/schemas/crm";
import type { Person } from "@/services/people.service";
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

interface PeopleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: EntitySheetMode;
  person?: Person | null;
  isLoading?: boolean;
  onSubmit: (data: CreatePerson | UpdatePerson) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PeopleDrawer({
  open,
  onOpenChange,
  mode,
  person,
  isLoading,
  onSubmit,
  onEdit,
  onDelete,
}: PeopleDrawerProps) {
  const isCreate = mode === "create";
  const isView = mode === "view";
  const schema = isCreate ? createPersonSchema : updatePersonSchema;

  const form = useForm<CreatePerson>({
    resolver: zodResolver(schema as typeof createPersonSchema),
    defaultValues: isCreate
      ? {
          name: "",
          email: undefined,
          phone: undefined,
          jobTitle: undefined,
          status: "lead",
          source: "manual",
        }
      : person
        ? {
            name: person.name,
            email: person.email ?? undefined,
            phone: person.phone ?? undefined,
            jobTitle: person.jobTitle ?? undefined,
            status: person.status,
            source: person.source,
          }
        : {},
  });

  const handleSubmit = form.handleSubmit((data) => onSubmit(data));

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={isCreate ? "Add Person" : mode === "edit" ? "Edit Person" : "Person Details"}
      description={
        isCreate
          ? "Create a new person in your CRM."
          : mode === "edit"
            ? "Update person information."
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
                  <Input placeholder="Full name" disabled={isView} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+1 (555) 000-0000"
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

          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Job title"
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as Person["status"])}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger>
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
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as Person["source"])}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="api">API</SelectItem>
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
