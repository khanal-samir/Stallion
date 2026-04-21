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
import { Plus } from "lucide-react";
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
import { Separator } from "@workspace/ui/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/ui/toggle-group";
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
import type { CustomFieldDefinition, CustomFieldType } from "@/types/crm";

type CustomFieldEntity = "people" | "org";

const CUSTOM_FIELD_TYPE_OPTIONS: Array<{ label: string; value: CustomFieldType }> = [
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Select", value: "select" },
  { label: "Date & Time", value: "dateTime" },
];

function CustomFieldRow({
  field,
  expanded,
  onToggle,
  onSave,
  onDelete,
  isPending,
}: {
  field: CustomFieldDefinition;
  expanded: boolean;
  onToggle: () => void;
  onSave: (input: UpdateCustomFieldDefinitionInput) => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const form = useForm<UpdateCustomFieldDefinitionInput>({
    resolver: zodResolver(updateCustomFieldDefinitionSchema),
    values: {
      label: field.label,
      options: field.options,
    },
  });

  return (
    <div className="rounded-md border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-sm font-medium">{field.label}</span>
        <span className="text-xs text-muted-foreground capitalize">{field.fieldType}</span>
      </button>

      {expanded && (
        <div className="border-t px-3 py-3">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                const payload: UpdateCustomFieldDefinitionInput = {
                  label: values.label,
                };

                if (field.fieldType === "select") {
                  payload.options = (values.options ?? []).filter(
                    (option) => option.label.trim().length > 0,
                  );
                }

                onSave(payload);
              })}
              className="space-y-3"
            >
              <FormField
                control={form.control}
                name="label"
                render={({ field: labelField }) => (
                  <FormItem>
                    <FormLabel>Field label</FormLabel>
                    <FormControl>
                      <Input {...labelField} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-xs text-muted-foreground">
                Type is fixed: <span className="capitalize">{field.fieldType}</span>
              </div>

              {field.fieldType === "select" && (
                <FormField
                  control={form.control}
                  name="options"
                  render={({ field: optionField }) => {
                    const options = optionField.value ?? [];

                    return (
                      <FormItem>
                        <FormLabel>Options</FormLabel>
                        <div className="space-y-2">
                          {options.map((option, index) => (
                            <div key={`option-${index}`} className="flex items-center gap-2">
                              <Input
                                value={option.label}
                                onChange={(event) => {
                                  const nextOptions = [...options];
                                  nextOptions[index] = {
                                    ...nextOptions[index],
                                    label: event.target.value,
                                  };
                                  optionField.onChange(nextOptions);
                                }}
                                disabled={isPending}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const nextOptions = options.filter(
                                    (_, optionIndex) => optionIndex !== index,
                                  );
                                  optionField.onChange(nextOptions);
                                }}
                                disabled={isPending}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              optionField.onChange([...(options ?? []), { label: "" }])
                            }
                            disabled={isPending}
                          >
                            Add option
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={isPending}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  disabled={isPending}
                >
                  Delete field
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}

export function CustomFieldsSettings() {
  const [entityType, setEntityType] = useState<CustomFieldEntity>("people");
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  const peopleFieldsQuery = usePeopleCustomFields();
  const orgFieldsQuery = useOrgCustomFields();

  const { mutate: createPeopleCustomField, isPending: isCreatePeoplePending } =
    useCreatePeopleCustomField();
  const { mutate: createOrgCustomField, isPending: isCreateOrgPending } = useCreateOrgCustomField();
  const { mutate: updatePeopleCustomField, isPending: isUpdatePeoplePending } =
    useUpdatePeopleCustomField();
  const { mutate: updateOrgCustomField, isPending: isUpdateOrgPending } = useUpdateOrgCustomField();
  const { mutate: deletePeopleCustomField, isPending: isDeletePeoplePending } =
    useDeletePeopleCustomField();
  const { mutate: deleteOrgCustomField, isPending: isDeleteOrgPending } = useDeleteOrgCustomField();

  const fields =
    entityType === "people" ? (peopleFieldsQuery.data ?? []) : (orgFieldsQuery.data ?? []);
  const isLoading =
    entityType === "people" ? peopleFieldsQuery.isLoading : orgFieldsQuery.isLoading;
  const isMutating =
    isCreatePeoplePending ||
    isCreateOrgPending ||
    isUpdatePeoplePending ||
    isUpdateOrgPending ||
    isDeletePeoplePending ||
    isDeleteOrgPending;

  const createForm = useForm<CreateCustomFieldDefinitionInput>({
    resolver: zodResolver(createCustomFieldDefinitionSchema),
    defaultValues: {
      label: "",
      type: "text",
      options: [],
    },
  });

  function resetCreateForm() {
    createForm.reset({ label: "", type: "text", options: [] });
  }

  function createField(input: CreateCustomFieldDefinitionInput) {
    if (entityType === "people") {
      createPeopleCustomField(input, {
        onSuccess: () => resetCreateForm(),
      });
      return;
    }

    createOrgCustomField(input, {
      onSuccess: () => resetCreateForm(),
    });
  }

  function updateField(id: string, input: UpdateCustomFieldDefinitionInput) {
    if (entityType === "people") {
      updatePeopleCustomField({ id, input });
      return;
    }

    updateOrgCustomField({ id, input });
  }

  function deleteField(id: string) {
    if (entityType === "people") {
      deletePeopleCustomField(id, {
        onSuccess: () => {
          if (expandedFieldId === id) {
            setExpandedFieldId(null);
          }
        },
      });
      return;
    }

    deleteOrgCustomField(id, {
      onSuccess: () => {
        if (expandedFieldId === id) {
          setExpandedFieldId(null);
        }
      },
    });
  }

  const createType = createForm.watch("type");

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-medium">Custom fields</h2>
          <p className="text-sm text-muted-foreground">
            Manage workspace-wide custom fields for people and organizations.
          </p>
        </div>

        <ToggleGroup
          type="single"
          value={entityType}
          onValueChange={(value) => {
            if (value === "people" || value === "org") {
              setEntityType(value);
              setExpandedFieldId(null);
              resetCreateForm();
            }
          }}
          variant="outline"
        >
          <ToggleGroupItem value="people">People</ToggleGroupItem>
          <ToggleGroupItem value="org">Organizations</ToggleGroupItem>
        </ToggleGroup>

        <div className="rounded-lg border bg-background p-4 space-y-4">
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit((values) => {
                const payload: CreateCustomFieldDefinitionInput = {
                  label: values.label,
                  type: values.type,
                  ...(values.type === "select" && {
                    options: (values.options ?? []).filter(
                      (option) => option.label.trim().length > 0,
                    ),
                  }),
                };

                createField(payload);
              })}
              className="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
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
                      <FormControl>
                        <select
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(event.target.value as CustomFieldType)
                          }
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                          disabled={isMutating}
                        >
                          {CUSTOM_FIELD_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {createType === "select" && (
                <FormField
                  control={createForm.control}
                  name="options"
                  render={({ field }) => {
                    const options = field.value ?? [];

                    return (
                      <FormItem>
                        <FormLabel>Options</FormLabel>
                        <div className="space-y-2">
                          {options.map((option, index) => (
                            <div key={`new-option-${index}`} className="flex items-center gap-2">
                              <Input
                                value={option.label}
                                onChange={(event) => {
                                  const nextOptions = [...options];
                                  nextOptions[index] = {
                                    ...nextOptions[index],
                                    label: event.target.value,
                                  };
                                  field.onChange(nextOptions);
                                }}
                                placeholder={`Option ${index + 1}`}
                                disabled={isMutating}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const nextOptions = options.filter(
                                    (_, optionIndex) => optionIndex !== index,
                                  );
                                  field.onChange(nextOptions);
                                }}
                                disabled={isMutating}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange([...(options ?? []), { label: "" }])}
                            disabled={isMutating}
                          >
                            Add option
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

              <div>
                <Button type="submit" size="sm" disabled={isMutating}>
                  <Plus className="size-3.5" />
                  Add field
                </Button>
              </div>
            </form>
          </Form>

          <Separator />

          <div className="space-y-2">
            {isLoading && <p className="text-sm text-muted-foreground">Loading custom fields...</p>}

            {!isLoading && fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No custom fields defined yet.</p>
            )}

            {fields.map((field: CustomFieldDefinition) => (
              <CustomFieldRow
                key={field.id}
                field={field}
                expanded={expandedFieldId === field.id}
                onToggle={() =>
                  setExpandedFieldId((current) => (current === field.id ? null : field.id))
                }
                onSave={(input) => updateField(field.id, input)}
                onDelete={() => deleteField(field.id)}
                isPending={isMutating}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
