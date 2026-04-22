"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { DealsKanban } from "@/components/crm/deals/deals-kanban";
import { DealsDrawer } from "@/components/crm/deals/deals-drawer";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useDeleteDeal } from "@/hooks/queries/use-deals";
import { useEntityDrawer } from "@/hooks/use-entity-drawer";
import { useEntityDelete } from "@/hooks/use-entity-delete";
import type { EntitySheetMode } from "@/components/shared/entity-sheet";
import type { Deal } from "@/types/crm";

export default function DealsPage() {
  const drawer = useEntityDrawer<Deal>();
  const deleteDialog = useEntityDelete<Deal>();
  const [initialStage, setInitialStage] = useState<string | undefined>(undefined);

  const { mutate: deleteDeal, isPending: isDeleting } = useDeleteDeal();

  const handleOpenDrawer = useCallback(
    (mode: EntitySheetMode, deal?: Deal, stage?: string) => {
      drawer.openDrawer(mode, deal);
      setInitialStage(stage);
    },
    [drawer],
  );

  function handleDeleteConfirm() {
    if (!deleteDialog.deleteTarget || deleteDialog.deleteTarget === "bulk") return;
    deleteDeal(deleteDialog.deleteTarget.id, {
      onSuccess: () => deleteDialog.closeDelete(),
    });
  }

  const confirmTitle =
    deleteDialog.deleteTarget && deleteDialog.deleteTarget !== "bulk"
      ? `Delete "${deleteDialog.deleteTarget.title}"?`
      : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description="Manage your pipeline and track deals through stages."
        actions={
          <Button size="sm" onClick={() => handleOpenDrawer("create")}>
            <Plus className="size-3.5" />
            Add Deal
          </Button>
        }
      />

      <DealsKanban onOpenDrawer={handleOpenDrawer} />

      <DealsDrawer
        open={drawer.drawer.open}
        onOpenChange={(open) => {
          drawer.onDrawerOpenChange(open);
          if (!open) setInitialStage(undefined);
        }}
        mode={drawer.drawer.mode}
        onModeChange={drawer.onDrawerModeChange}
        deal={drawer.drawer.entity}
        initialStage={initialStage}
        onDeleteSuccess={deleteDialog.closeDelete}
      />

      <ConfirmDialog
        open={deleteDialog.deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) deleteDialog.closeDelete();
        }}
        title={confirmTitle}
        description="This will permanently remove this deal from your pipeline. This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting…" : "Delete"}
        variant="destructive"
        isPending={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
