"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Button } from "@workspace/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import type { PersonStatus } from "@workspace/validators/schemas/crm";
import type { Person } from "@/types/crm";

// ─── Status config ───────────────────────────────────────────────────────────

export const PERSON_STATUS_CONFIG: Record<PersonStatus, { label: string; className: string }> = {
  lead: {
    label: "Lead",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-transparent",
  },
  prospect: {
    label: "Prospect",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-transparent",
  },
  qualified: {
    label: "Qualified",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-transparent",
  },
  customer: {
    label: "Customer",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border-transparent",
  },
  churned: {
    label: "Churned",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-transparent",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

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
          <span className="text-muted-foreground/40">—</span>
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
          <span className="text-muted-foreground/40">—</span>
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
          <span className="text-muted-foreground/40">—</span>
        ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      cell: ({ row }) => {
        const { status } = row.original;
        const config = PERSON_STATUS_CONFIG[status];
        return (
          <Badge className={cn("capitalize font-medium", config.className)}>{config.label}</Badge>
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
        return name ? (
          <span className="text-sm truncate max-w-40 block">{name}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      },
    },
    {
      id: "ownerName",
      header: "Owner",
      enableSorting: false,
      cell: ({ row }) => {
        const name = row.original.ownerName ?? row.original.owner?.name;
        return name ? (
          <span className="text-sm text-muted-foreground">{name}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      },
    },
    {
      id: "lastContactedAt",
      accessorKey: "lastContactedAt",
      header: "Last Contacted",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.lastContactedAt)}
        </span>
      ),
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
              aria-label="Open row actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onView(row.original)}>
              <Eye className="size-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
