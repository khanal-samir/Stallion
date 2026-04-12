import type { ColumnDef } from "@tanstack/react-table";
import type { Person } from "@/services/people.service";
import { Badge } from "@workspace/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu";
import { Button } from "@workspace/ui/components/ui/button";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { getSelectColumn } from "@/components/shared/data-table";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  lead: "secondary",
  prospect: "outline",
  qualified: "default",
  customer: "default",
  churned: "destructive",
};

interface PeopleColumnsOpts {
  onView?: (person: Person) => void;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
}

export function getPeopleColumns(opts: PeopleColumnsOpts = {}): ColumnDef<Person>[] {
  return [
    getSelectColumn<Person>(),
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.getValue("email") ?? "—",
    },
    {
      accessorKey: "jobTitle",
      header: "Job Title",
      cell: ({ row }) => row.getValue("jobTitle") ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <Badge variant={statusVariant[status] ?? "secondary"}>{status}</Badge>;
      },
      filterFn: (row, _id, value) => row.getValue("status") === value,
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        const source = row.getValue("source") as string;
        return <span className="capitalize">{source}</span>;
      },
      filterFn: (row, _id, value) => row.getValue("source") === value,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const person = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {opts.onView && (
                <DropdownMenuItem onClick={() => opts.onView!(person)}>
                  <Eye className="w-4 h-4 mr-1.5" />
                  View
                </DropdownMenuItem>
              )}
              {opts.onEdit && (
                <DropdownMenuItem onClick={() => opts.onEdit!(person)}>
                  <Pencil className="w-4 h-4 mr-1.5" />
                  Edit
                </DropdownMenuItem>
              )}
              {opts.onDelete && (
                <DropdownMenuItem variant="destructive" onClick={() => opts.onDelete!(person)}>
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
