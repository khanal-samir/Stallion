"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu";
import type { Organization } from "@/types/crm";

interface GetOrgsColumnsProps {
  onView: (org: Organization) => void;
  onEdit: (org: Organization) => void;
  onDelete: (org: Organization) => void;
}

export function getOrgsColumns({
  onView,
  onEdit,
  onDelete,
}: GetOrgsColumnsProps): ColumnDef<Organization>[] {
  return [
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
          <span className="text-sm text-muted-foreground/50">—</span>
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
          <span className="text-muted-foreground/50">—</span>
        ),
    },
    {
      id: "size",
      accessorKey: "size",
      header: "Size",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.size ? (
          <span>{row.original.size}</span>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        ),
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
          <span className="text-sm text-muted-foreground/50">—</span>
        ),
    },
    {
      id: "peopleCount",
      header: "People",
      enableSorting: false,
      cell: ({ row }) => {
        const count = row.original.peopleCount ?? 0;
        return (
          <span className="tabular-nums text-muted-foreground">
            {count}
          </span>
        );
      },
    },
    {
      id: "__actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              data-row-action="true"
              aria-label="Open actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(row.original)}>
              <Eye className="size-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
