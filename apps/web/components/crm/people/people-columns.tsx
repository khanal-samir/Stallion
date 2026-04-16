"use client";

import dayjs from "dayjs";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/ui/badge";
import { cn } from "@workspace/ui/lib/utils";
import { CrmRowActions } from "@/components/crm/crm-row-actions";
import type { Person } from "@/types/crm";
import { PERSON_STATUS_OPTIONS } from "@/components/crm/crm-options";

// ─── Column factory ──────────────────────────────────────────────────────────

interface GetPeopleColumnsProps {
  onView: (person: Person) => void;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
}

export function getPeopleColumns({
  onView,
  onEdit,
  onDelete,
}: GetPeopleColumnsProps): ColumnDef<Person>[] {
  const emptyCell = <span className="text-muted-foreground/40">—</span>;

  return [
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      enableHiding: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onView(row.original)}
          className="font-medium text-foreground hover:text-primary hover:underline underline-offset-4 transition-colors text-left max-w-50 truncate"
        >
          {row.original.name}
        </button>
      ),
    },
    {
      id: "email",
      accessorKey: "email",
      header: "Email",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.email ? (
          <span className="text-muted-foreground text-sm truncate max-w-45 block">
            {row.original.email}
          </span>
        ) : (
          emptyCell
        ),
    },
    {
      id: "phone",
      accessorKey: "phone",
      header: "Phone",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.phone ? (
          <span className="text-muted-foreground text-sm">{row.original.phone}</span>
        ) : (
          emptyCell
        ),
    },
    {
      id: "jobTitle",
      accessorKey: "jobTitle",
      header: "Job Title",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.jobTitle ? (
          <span className="text-sm truncate max-w-40 block">{row.original.jobTitle}</span>
        ) : (
          emptyCell
        ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      cell: ({ row }) => {
        const config = PERSON_STATUS_OPTIONS.find((option) => option.value === row.original.status);
        if (!config) return null;
        return (
          <Badge className={cn("capitalize font-medium", config.badgeClassName)}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: "source",
      accessorKey: "source",
      header: "Source",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground capitalize">{row.original.source}</span>
      ),
    },
    {
      id: "orgName",
      header: "Organization",
      enableSorting: false,
      cell: ({ row }) => {
        const name = row.original.orgName ?? row.original.org?.name;
        return name ? <span className="text-sm truncate max-w-40 block">{name}</span> : emptyCell;
      },
    },
    {
      id: "ownerName",
      header: "Owner",
      enableSorting: false,
      cell: ({ row }) => {
        const name = row.original.ownerName ?? row.original.owner?.name;
        return name ? <span className="text-sm text-muted-foreground">{name}</span> : emptyCell;
      },
    },
    {
      id: "lastContactedAt",
      accessorKey: "lastContactedAt",
      header: "Last Contacted",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {row.original.lastContactedAt
            ? dayjs(row.original.lastContactedAt).format("MMM D, YYYY")
            : "—"}
        </span>
      ),
    },
    {
      id: "__actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <CrmRowActions
          triggerLabel="Open row actions"
          contentClassName="w-36"
          onView={() => onView(row.original)}
          onEdit={() => onEdit(row.original)}
          onDelete={() => onDelete(row.original)}
        />
      ),
    },
  ];
}
