import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu";

interface CrmRowActionsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  triggerLabel: string;
  contentClassName?: string;
}

export function CrmRowActions({
  onView,
  onEdit,
  onDelete,
  triggerLabel,
  contentClassName,
}: CrmRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" data-row-action="true" aria-label={triggerLabel}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={contentClassName}>
        <DropdownMenuItem onClick={onView}>
          <Eye className="size-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
