"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { DealsKanban, type DrawerState } from "@/components/crm/deals/deals-kanban";
import { DealsDrawer } from "@/components/crm/deals/deals-drawer";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useDeleteDeal } from "@/hooks/queries/use-deals";
import type { EntitySheetMode } from "@/components/shared/entity-sheet";
import type { Deal } from "@/types/crm";

export default function DealsPage() {
  const [drawer, setDrawer] = useState<DrawerState>({
    open: false,
    mode: "view",
  });
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);

  const { mutate: deleteDeal, isPending: isDeleting } = useDeleteDeal();

  function openDrawer(mode: EntitySheetMode, deal?: Deal, initialStage?: string) {
    setDrawer({ open: true, mode, deal, initialStage });
  }

  function closeDrawer() {
    setDrawer((prev) => ({ ...prev, open: false }));
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteDeal(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description="Manage your pipeline and track deals through stages."
        actions={
          <Button size="sm" onClick={() => openDrawer("create")}>
            <Plus className="size-3.5" />
            Add Deal
          </Button>
        }
      />

      <DealsKanban
        drawerState={drawer}
        onDrawerStateChange={setDrawer}
      />

      <DealsDrawer
        open={drawer.open}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
        mode={drawer.mode}
        onModeChange={(mode) =>
          setDrawer((prev) => ({ ...prev, mode }))
        }
        deal={drawer.deal}
        initialStage={drawer.initialStage}
        onDeleteSuccess={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This will permanently remove this deal from your pipeline. This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting…" : "Delete"}
        variant="destructive"
        isPending={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
