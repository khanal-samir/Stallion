"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import { CrmRowActions } from "@/components/crm/crm-row-actions";
import type { CustomFieldDefinition, Organization } from "@/types/crm";
import { buildCustomFieldColumns } from "@/lib/crm-custom-fields";

interface GetOrgsColumnsProps {
  onView: (org: Organization) => void;
  onEdit: (org: Organization) => void;
  onDelete: (org: Organization) => void;
  customFields?: CustomFieldDefinition[];
}

export function getOrgsColumns({
  onView,
  onEdit,
  onDelete,
  customFields = [],
}: GetOrgsColumnsProps): ColumnDef<Organization>[] {
  const emptyCell = <span className="text-sm text-muted-foreground/50">—</span>;

  const baseColumns: ColumnDef<Organization>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => (
        <button
          type="button"
          className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors text-left"
          onClick={() => onView(row.original)}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
            <Building2 className="size-3.5" />
          </span>
          {row.original.name}
        </button>
      ),
    },
    {
      id: "domain",
      accessorKey: "domain",
      header: "Domain",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.domain ? (
          <span className="text-sm text-muted-foreground">{row.original.domain}</span>
        ) : (
          emptyCell
        ),
    },
    {
      id: "industry",
      accessorKey: "industry",
      header: "Industry",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.industry ? (
          <span className="capitalize">{row.original.industry}</span>
        ) : (
          emptyCell
        ),
    },
    {
      id: "size",
      accessorKey: "size",
      header: "Size",
      enableSorting: true,
      cell: ({ row }) => (row.original.size ? <span>{row.original.size}</span> : emptyCell),
    },
    {
      id: "location",
      accessorKey: "location",
      header: "Location",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.location ? (
          <span className="text-sm text-muted-foreground">{row.original.location}</span>
        ) : (
          emptyCell
        ),
    },
    {
      id: "peopleCount",
      header: "People",
      enableSorting: false,
      cell: ({ row }) => {
        const count = row.original.peopleCount ?? 0;
        return <span className="tabular-nums text-muted-foreground">{count}</span>;
      },
    },
    {
      id: "__actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <CrmRowActions
          triggerLabel="Open actions"
          onView={() => onView(row.original)}
          onEdit={() => onEdit(row.original)}
          onDelete={() => onDelete(row.original)}
        />
      ),
    },
  ];

  const customColumns = buildCustomFieldColumns<Organization>(customFields);
  const actionColumn = baseColumns[baseColumns.length - 1]!;

  return [...baseColumns.slice(0, -1), ...customColumns, actionColumn];
}
