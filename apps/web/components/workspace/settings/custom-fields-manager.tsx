"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  createCustomFieldDefinitionSchema,
  updateCustomFieldDefinitionSchema,
  type CreateCustomFieldDefinitionInput,
  type UpdateCustomFieldDefinitionInput,
} from "@workspace/validators/schemas/crm";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/ui/form";
import { Input } from "@workspace/ui/components/ui/input";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/ui/dialog";
import { Badge } from "@workspace/ui/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select";
import {
  useCreateOrgCustomField,
  useCreatePeopleCustomField,
  useDeleteOrgCustomField,
  useDeletePeopleCustomField,
  useOrgCustomFields,
  usePeopleCustomFields,
  useUpdateOrgCustomField,
  useUpdatePeopleCustomField,
} from "@/hooks/queries/use-crm-custom-fields";
import type { CustomFieldDefinition } from "@/types/crm";
import {
  CUSTOM_FIELD_TYPE_OPTIONS,
  ENTITY_CONFIG,
  typeBadgeVariant,
  typeLabel,
  type CustomFieldEntity,
} from "@/constants/custom-fields";

function OptionsEditor({
  options,
  onChange,
  disabled,
}: {
  options: { label: string }[];
  onChange: (options: { label: string }[]) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div key={`option-${index}`} className="flex items-center gap-2">
          <Input
            value={option.label}
            onChange={(event) => {
              const next = [...options];
              next[index] = { ...next[index], label: event.target.value };
              onChange(next);
            }}
            placeholder={`Option ${index + 1}`}
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(options.filter((_, i) => i !== index))}
            disabled={disabled}
          >
            Remove
          </Button>
        </div>
      ))}
      <div className="pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...options, { label: "" }])}
          disabled={disabled}
        >
          Add option
        </Button>
      </div>
    </div>
  );
}

interface CustomFieldsManagerUIProps {
  entityType: CustomFieldEntity;
  fields: CustomFieldDefinition[];
  isLoading: boolean;
  isMutating: boolean;
  onCreate: (input: CreateCustomFieldDefinitionInput, options?: { onSuccess?: () => void }) => void;
  onUpdate: (
    id: string,
    input: UpdateCustomFieldDefinitionInput,
    options?: { onSuccess?: () => void },
  ) => void;
  onDelete: (id: string, options?: { onSuccess?: () => void }) => void;
}

function CustomFieldsManagerUI({
  entityType,
  fields,
  isLoading,
  isMutating,
  onCreate,
  onUpdate,
  onDelete,
}: CustomFieldsManagerUIProps) {
  const [mode, setMode] = useState<"create" | "edit" | "delete" | null>(null);
  const [activeField, setActiveField] = useState<CustomFieldDefinition | null>(null);

  const config = ENTITY_CONFIG[entityType];

  const createForm = useForm<CreateCustomFieldDefinitionInput>({
    resolver: zodResolver(createCustomFieldDefinitionSchema),
    defaultValues: { label: "", type: "text", options: [] },
  });

  const editForm = useForm<UpdateCustomFieldDefinitionInput>({
    resolver: zodResolver(updateCustomFieldDefinitionSchema),
    defaultValues: { label: "", options: [] },
  });

  const openCreate = () => {
    setActiveField(null);
    createForm.reset({ label: "", type: "text", options: [] });
    setMode("create");
  };

  const openEdit = (field: CustomFieldDefinition) => {
    setActiveField(field);
    editForm.reset({
      label: field.label,
      options: field.options.map((o) => ({ label: o.label })),
    });
    setMode("edit");
  };

  const closeDialog = () => {
    setMode(null);
    setActiveField(null);
  };

  const handleCreate = (values: CreateCustomFieldDefinitionInput) => {
    const payload: CreateCustomFieldDefinitionInput = {
      label: values.label,
      type: values.type,
      ...(values.type === "select" && {
        options: (values.options ?? []).filter((o) => o.label.trim().length > 0),
      }),
    };

    onCreate(payload, {
      onSuccess: () => {
        createForm.reset({ label: "", type: "text", options: [] });
        setMode(null);
      },
    });
  };

  const handleUpdate = (values: UpdateCustomFieldDefinitionInput) => {
    if (!activeField) return;

    const payload: UpdateCustomFieldDefinitionInput = {
      label: values.label,
    };

    if (activeField.fieldType === "select") {
      payload.options = (values.options ?? []).filter((o) => o.label.trim().length > 0);
    }

    onUpdate(activeField.id, payload, {
      onSuccess: () => {
        editForm.reset({ label: "", options: [] });
        setMode(null);
        setActiveField(null);
      },
    });
  };

  const handleDelete = () => {
    if (!activeField) return;
    onDelete(activeField.id, { onSuccess: () => closeDialog() });
  };

  const sortedFields = [...fields].sort((a, b) => a.label.localeCompare(b.label));

  const Icon = config.icon;
  // eslint-disable-next-line react-hooks/incompatible-library
  const createType = createForm.watch("type");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
            <Icon className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-medium">{config.label} custom fields</h2>
            <p className="text-sm text-muted-foreground">
              Manage custom fields for {config.label.toLowerCase()}.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={openCreate} disabled={isMutating}>
          <Plus className="size-4 mr-1.5" />
          Add field
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Label</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Options</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Loading custom fields…
                </TableCell>
              </TableRow>
            ) : sortedFields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No custom fields defined yet.
                </TableCell>
              </TableRow>
            ) : (
              sortedFields.map((field) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">{field.label}</TableCell>
                  <TableCell>
                    <Badge variant={typeBadgeVariant(field.fieldType)}>
                      {typeLabel(field.fieldType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {field.fieldType === "select" ? (
                      <div className="flex flex-wrap gap-1">
                        {field.options.map((option) => (
                          <Badge variant="secondary" key={option.id} className="text-xs">
                            {option.label}
                          </Badge>
                        ))}
                        {field.options.length === 0 && (
                          <span className="text-muted-foreground text-xs">No options</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(field)}
                        disabled={isMutating}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          setActiveField(field);
                          setMode("delete");
                        }}
                        disabled={isMutating}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={mode === "create" || mode === "edit"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit custom field" : "Create custom field"}</DialogTitle>
            <DialogDescription>
              {mode === "edit"
                ? "Update the label and options for this field."
                : `Add a new custom field to ${config.label.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>

          {mode === "edit" ? (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4 py-2">
                <FormField
                  control={editForm.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field label</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isMutating} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-xs text-muted-foreground">
                  Type is fixed:{" "}
                  <Badge variant={typeBadgeVariant(activeField!.fieldType)} className="ml-1">
                    {typeLabel(activeField!.fieldType)}
                  </Badge>
                </div>

                {activeField!.fieldType === "select" && (
                  <FormField
                    control={editForm.control}
                    name="options"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Options</FormLabel>
                        <FormControl>
                          <OptionsEditor
                            options={field.value ?? []}
                            onChange={field.onChange}
                            disabled={isMutating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                    disabled={isMutating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isMutating}>
                    {isMutating ? "Saving…" : "Save changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-2">
                <FormField
                  control={createForm.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Renewal Date" {...field} disabled={isMutating} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) =>
                          field.onChange(
                            value as (typeof CUSTOM_FIELD_TYPE_OPTIONS)[number]["value"],
                          )
                        }
                        disabled={isMutating}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CUSTOM_FIELD_TYPE_OPTIONS.map((option) => (
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

                {createType === "select" && (
                  <FormField
                    control={createForm.control}
                    name="options"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Options</FormLabel>
                        <FormControl>
                          <OptionsEditor
                            options={field.value ?? []}
                            onChange={field.onChange}
                            disabled={isMutating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                    disabled={isMutating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isMutating}>
                    {isMutating ? "Creating…" : "Create field"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={mode === "delete"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete custom field</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{activeField?.label}</strong>? This action
              cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeDialog} disabled={isMutating}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isMutating}>
              {isMutating ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PeopleCustomFieldsManager() {
  const { data: fields = [], isLoading } = usePeopleCustomFields();
  const { mutate: create, isPending: isCreatePending } = useCreatePeopleCustomField();
  const { mutate: update, isPending: isUpdatePending } = useUpdatePeopleCustomField();
  const { mutate: delete_, isPending: isDeletePending } = useDeletePeopleCustomField();

  const isMutating = isCreatePending || isUpdatePending || isDeletePending;

  return (
    <CustomFieldsManagerUI
      entityType="people"
      fields={fields}
      isLoading={isLoading}
      isMutating={isMutating}
      onCreate={(input, opts) => create(input, opts)}
      onUpdate={(id, input, opts) => update({ id, input }, opts)}
      onDelete={(id, opts) => delete_(id, opts)}
    />
  );
}

export function OrgCustomFieldsManager() {
  const { data: fields = [], isLoading } = useOrgCustomFields();
  const { mutate: create, isPending: isCreatePending } = useCreateOrgCustomField();
  const { mutate: update, isPending: isUpdatePending } = useUpdateOrgCustomField();
  const { mutate: delete_, isPending: isDeletePending } = useDeleteOrgCustomField();

  const isMutating = isCreatePending || isUpdatePending || isDeletePending;

  return (
    <CustomFieldsManagerUI
      entityType="org"
      fields={fields}
      isLoading={isLoading}
      isMutating={isMutating}
      onCreate={(input, opts) => create(input, opts)}
      onUpdate={(id, input, opts) => update({ id, input }, opts)}
      onDelete={(id, opts) => delete_(id, opts)}
    />
  );
}
