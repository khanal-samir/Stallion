import dayjs from "dayjs";
import type { ColumnDef } from "@tanstack/react-table";
import type { CustomFieldDefinition } from "@/types/crm";

type CrmEntity = { customFields?: Record<string, unknown> | null };

function getCustomFieldColumnId(fieldId: string) {
  return `custom:${fieldId}`;
}

export function buildCustomFieldColumns<T extends CrmEntity>(
  fields: CustomFieldDefinition[],
): ColumnDef<T>[] {
  return fields.map((field) => ({
    id: getCustomFieldColumnId(field.id),
    header: field.label,
    enableSorting: true,
    cell: ({ row }) => {
      const customValue = row.original.customFields?.[field.id];
      if (customValue === undefined || customValue === null || customValue === "") {
        return <span className="text-muted-foreground/40">-</span>;
      }

      if (field.fieldType === "select") {
        const option = field.options.find((item) => item.id === String(customValue));
        return <span>{option?.label ?? "-"}</span>;
      }

      if (field.fieldType === "dateTime") {
        const date = dayjs(String(customValue));
        return <span>{date.isValid() ? date.format("MMM D, YYYY") : "-"}</span>;
      }

      return <span>{String(customValue)}</span>;
    },
  }));
}

export function buildCustomFieldsPayload(
  customFields: CustomFieldDefinition[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of customFields) {
    const rawValue = values[field.id];

    if (field.fieldType === "text") {
      const textValue = typeof rawValue === "string" ? rawValue.trim() : "";
      if (textValue) {
        payload[field.id] = textValue;
      }
      continue;
    }

    if (field.fieldType === "number") {
      const normalizedValue =
        typeof rawValue === "number"
          ? rawValue
          : typeof rawValue === "string"
            ? Number(rawValue)
            : Number.NaN;

      if (!Number.isNaN(normalizedValue)) {
        payload[field.id] = normalizedValue;
      }
      continue;
    }

    if (field.fieldType === "select") {
      const selectedOptionId = typeof rawValue === "string" ? rawValue : "";
      if (selectedOptionId) {
        payload[field.id] = selectedOptionId;
      }
      continue;
    }

    if (field.fieldType === "dateTime") {
      const dateValue = typeof rawValue === "string" ? rawValue : "";
      const parsed = dayjs(dateValue);
      if (dateValue && parsed.isValid()) {
        payload[field.id] = parsed.format("YYYY-MM-DDTHH:mm:ss");
      }
    }
  }

  return payload;
}

export function toDateTimeInputValue(value: unknown) {
  if (typeof value !== "string" || !value) {
    return "";
  }

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return "";
  }

  return parsed.format("YYYY-MM-DDTHH:mm");
}

export function formatCustomFieldValueForView(
  field: CustomFieldDefinition,
  value: unknown,
): string {
  if (value === undefined || value === null || value === "") {
    return "Not set";
  }

  if (field.fieldType === "select") {
    const option = field.options.find((item) => item.id === String(value));
    return option?.label ?? "Not set";
  }

  if (field.fieldType === "dateTime") {
    const date = dayjs(String(value));
    return date.isValid() ? date.format("MMMM D, YYYY h:mm A") : "Not set";
  }

  return String(value);
}
