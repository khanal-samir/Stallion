import type { ColumnDef } from "@tanstack/react-table";
import type { Org } from "@/services/orgs.service";
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

interface OrgsColumnsOpts {
  onView?: (org: Org) => void;
  onEdit?: (org: Org) => void;
  onDelete?: (org: Org) => void;
}

export function getOrgsColumns(opts: OrgsColumnsOpts = {}): ColumnDef<Org>[] {
  return [
    getSelectColumn<Org>(),
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "domain",
      header: "Domain",
      cell: ({ row }) => row.getValue("domain") ?? "—",
    },
    {
      accessorKey: "industry",
      header: "Industry",
      cell: ({ row }) => {
        const industry = row.getValue("industry") as string | null;
        return industry ? <Badge variant="outline">{industry}</Badge> : "—";
      },
      filterFn: (row, _id, value) => row.getValue("industry") === value,
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }) => row.getValue("size") ?? "—",
      filterFn: (row, _id, value) => row.getValue("size") === value,
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => row.getValue("location") ?? "—",
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const org = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {opts.onView && (
                <DropdownMenuItem onClick={() => opts.onView!(org)}>
                  <Eye className="w-4 h-4 mr-1.5" />
                  View
                </DropdownMenuItem>
              )}
              {opts.onEdit && (
                <DropdownMenuItem onClick={() => opts.onEdit!(org)}>
                  <Pencil className="w-4 h-4 mr-1.5" />
                  Edit
                </DropdownMenuItem>
              )}
              {opts.onDelete && (
                <DropdownMenuItem variant="destructive" onClick={() => opts.onDelete!(org)}>
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
