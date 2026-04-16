"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/ui/sheet";
import { Button } from "@workspace/ui/components/ui/button";
import { Separator } from "@workspace/ui/components/ui/separator";
import { LoadingState } from "@/components/shared/loading-state";

type EntitySheetMode = "view" | "edit" | "create";

interface EntitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  mode: EntitySheetMode;
  isLoading?: boolean;
  isSaving?: boolean;
  children: ReactNode;
  onEdit?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  saveLabel?: string;
  deleteLabel?: string;
  className?: string;
}

export function EntitySheet({
  open,
  onOpenChange,
  title,
  description,
  mode,
  isLoading = false,
  isSaving = false,
  children,
  onEdit,
  onSave,
  onDelete,
  saveLabel,
  deleteLabel = "Delete",
  className,
}: EntitySheetProps) {
  const computedSaveLabel = saveLabel ?? (mode === "create" ? "Create" : "Save");
  const isBlocked = isLoading || isSaving;
  const isViewMode = mode === "view";
  const isEditableMode = mode === "edit" || mode === "create";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={className ?? "w-full sm:max-w-xl"}>
        <SheetHeader className="pr-12">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <SheetTitle>{title}</SheetTitle>
              {description ? <SheetDescription>{description}</SheetDescription> : null}
            </div>

            {isViewMode && onEdit ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEdit}
                disabled={isBlocked}
              >
                Edit
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <LoadingState variant="section" text="Loading details..." className="p-0" />
          ) : (
            children
          )}
        </div>

        {isEditableMode || onDelete ? (
          <>
            <Separator />
            <SheetFooter className="border-t-0 pt-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2">
                {onDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onDelete}
                    disabled={isBlocked}
                  >
                    {deleteLabel}
                  </Button>
                ) : null}
              </div>

              {isEditableMode ? (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isBlocked}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={onSave} disabled={isBlocked || !onSave}>
                    {isSaving ? "Saving…" : computedSaveLabel}
                  </Button>
                </div>
              ) : null}
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export type { EntitySheetMode, EntitySheetProps };
