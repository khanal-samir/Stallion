import dayjs from "dayjs";
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import type {
  CustomFieldDefinition,
  CustomFieldFilterValue,
  CustomFieldType,
  Organization,
  OrganizationsListParams,
  PeopleListParams,
  Person,
} from "@/types/crm";
import type { FilterConfig } from "@/components/shared/data-table";

type CrmEntity = Person | Organization;

export function getCustomFieldColumnId(fieldId: string) {
  return `custom:${fieldId}`;
}

export function getFieldIdFromColumnId(columnId: string) {
  return columnId.startsWith("custom:") ? columnId.slice("custom:".length) : undefined;
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

export function buildCustomFieldFilterConfig(fields: CustomFieldDefinition[]): FilterConfig[] {
  return fields.map((field) => {
    if (field.fieldType === "select") {
      return {
        columnId: getCustomFieldColumnId(field.id),
        label: field.label,
        allLabel: `All ${field.label}`,
        type: "select",
        options: field.options.map((option) => ({
          label: option.label,
          value: option.id,
        })),
      } satisfies FilterConfig;
    }

    return {
      columnId: getCustomFieldColumnId(field.id),
      label: field.label,
      allLabel:
        field.fieldType === "dateTime"
          ? "Any date"
          : field.fieldType === "number"
            ? "Any value"
            : `Contains ${field.label}`,
      type: mapFieldTypeToFilterType(field.fieldType),
    } satisfies FilterConfig;
  });
}

export function extractCustomSort(
  sorting: SortingState,
  nativeSortIds: Set<string>,
): { customSortFieldId?: string; customSortOrder?: "asc" | "desc" } {
  const firstSort = sorting[0];
  if (!firstSort) {
    return {};
  }

  if (nativeSortIds.has(firstSort.id)) {
    return {};
  }

  const fieldId = getFieldIdFromColumnId(firstSort.id);
  if (!fieldId) {
    return {};
  }

  return {
    customSortFieldId: fieldId,
    customSortOrder: firstSort.desc ? "desc" : "asc",
  };
}

export function buildPeopleListParams(args: {
  pagination: PaginationState;
  sorting: SortingState;
  debouncedSearch: string;
  statusFilter?: string;
  sourceFilter?: string;
  columnFilters: ColumnFiltersState;
  customFields: CustomFieldDefinition[];
}): PeopleListParams {
  const nativeSortIds = new Set([
    "name",
    "email",
    "phone",
    "jobTitle",
    "status",
    "source",
    "lastContactedAt",
    "createdAt",
    "updatedAt",
  ]);

  const customSort = extractCustomSort(args.sorting, nativeSortIds);
  const customFilters = serializeCustomFilters(args.columnFilters, args.customFields);

  const firstSort = args.sorting[0];
  const params: PeopleListParams = {
    page: args.pagination.pageIndex + 1,
    pageSize: args.pagination.pageSize,
    ...(firstSort && nativeSortIds.has(firstSort.id)
      ? {
          sortBy: firstSort.id as PeopleListParams["sortBy"],
          sortOrder: firstSort.desc ? "desc" : "asc",
        }
      : {}),
    ...(customSort.customSortFieldId
      ? {
          customSortFieldId: customSort.customSortFieldId,
          sortOrder: customSort.customSortOrder ?? "asc",
        }
      : {}),
    ...(args.debouncedSearch.trim() && { search: args.debouncedSearch.trim() }),
    ...(args.statusFilter && { status: args.statusFilter as PeopleListParams["status"] }),
    ...(args.sourceFilter && { source: args.sourceFilter as PeopleListParams["source"] }),
    ...(customFilters && { customFilters }),
  };

  return params;
}

export function buildOrgsListParams(args: {
  pagination: PaginationState;
  sorting: SortingState;
  debouncedSearch: string;
  industryFilter?: string;
  sizeFilter?: string;
  columnFilters: ColumnFiltersState;
  customFields: CustomFieldDefinition[];
}): OrganizationsListParams {
  const nativeSortIds = new Set([
    "name",
    "domain",
    "industry",
    "size",
    "location",
    "createdAt",
    "updatedAt",
  ]);

  const customSort = extractCustomSort(args.sorting, nativeSortIds);
  const customFilters = serializeCustomFilters(args.columnFilters, args.customFields);

  const firstSort = args.sorting[0];
  const params: OrganizationsListParams = {
    page: args.pagination.pageIndex + 1,
    pageSize: args.pagination.pageSize,
    ...(firstSort && nativeSortIds.has(firstSort.id)
      ? {
          sortBy: firstSort.id as OrganizationsListParams["sortBy"],
          sortOrder: firstSort.desc ? "desc" : "asc",
        }
      : {}),
    ...(customSort.customSortFieldId
      ? {
          customSortFieldId: customSort.customSortFieldId,
          sortOrder: customSort.customSortOrder ?? "asc",
        }
      : {}),
    ...(args.debouncedSearch.trim() && { search: args.debouncedSearch.trim() }),
    ...(args.industryFilter && { industry: args.industryFilter }),
    ...(args.sizeFilter && { size: args.sizeFilter }),
    ...(customFilters && { customFilters }),
  };

  return params;
}

export function sanitizeCustomFieldsPayload(
  input: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!input) {
    return undefined;
  }

  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        continue;
      }
      next[key] = trimmed;
      continue;
    }

    next[key] = value;
  }

  return Object.keys(next).length > 0 ? next : undefined;
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

function mapFieldTypeToFilterType(type: CustomFieldType): FilterConfig["type"] {
  if (type === "text") return "text";
  if (type === "number") return "number";
  if (type === "dateTime") return "dateRange";
  return "select";
}

function serializeCustomFilters(
  columnFilters: ColumnFiltersState,
  customFields: CustomFieldDefinition[],
): string | undefined {
  const customFieldMap = new Map(
    customFields.map((field) => [getCustomFieldColumnId(field.id), field]),
  );
  const payload: CustomFieldFilterValue[] = [];

  for (const filter of columnFilters) {
    const field = customFieldMap.get(filter.id);
    if (!field) {
      continue;
    }

    if (field.fieldType === "dateTime") {
      if (typeof filter.value === "object" && filter.value !== null) {
        const range = filter.value as { from?: string; to?: string };
        if (range.from || range.to) {
          payload.push({
            fieldId: field.id,
            type: "dateTime",
            from: range.from,
            to: range.to,
          });
        }
      }
      continue;
    }

    if (typeof filter.value !== "string") {
      continue;
    }

    const value = filter.value.trim();
    if (!value) {
      continue;
    }

    payload.push({
      fieldId: field.id,
      type: field.fieldType,
      value,
    });
  }

  return payload.length > 0 ? JSON.stringify(payload) : undefined;
}
