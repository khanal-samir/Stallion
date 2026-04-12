"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/ui/sheet";
import { Separator } from "@workspace/ui/components/ui/separator";

export type EntitySheetMode = "view" | "edit" | "create";

interface EntitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  mode: EntitySheetMode;
  isLoading?: boolean;
  children: React.ReactNode;
  onEdit?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
}

export function EntitySheet({
  open,
  onOpenChange,
  title,
  description,
  mode,
  isLoading,
  children,
  onEdit,
  onSave,
  onDelete,
  onCancel,
  saveLabel = "Save",
}: EntitySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-lg">{title}</SheetTitle>
          {description && <SheetDescription className="text-sm">{description}</SheetDescription>}
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            children
          )}
        </div>

        <Separator />

        <SheetFooter className="px-6 py-4 flex-shrink-0">
          {mode === "view" ? (
            <div className="flex items-center gap-2 w-full">
              {onEdit && (
                <Button onClick={onEdit} size="sm" className="flex-1">
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  Delete
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel ?? (() => onOpenChange(false))}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button size="sm" onClick={onSave} disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                {saveLabel}
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
