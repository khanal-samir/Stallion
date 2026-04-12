"use client";

import { useState, useMemo } from "react";
import { Building2, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useCreateOrg,
  useUpdateOrg,
  useDeleteOrg,
  useBulkDeleteOrgs,
} from "@/hooks/queries/use-orgs";
import { getOrgsColumns } from "./orgs-columns";
import { orgsFilters } from "./orgs-filters";
import { OrgsDrawer } from "./orgs-drawer";
import type { Org } from "@/services/orgs.service";
import type { CreateOrg, UpdateOrg } from "@workspace/validators/schemas/crm";
import type { EntitySheetMode } from "@/components/shared/entity-sheet";

interface OrgsDataTableProps {
  orgs: Org[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function OrgsDataTable({ orgs, isLoading, error, refetch }: OrgsDataTableProps) {
  const createOrg = useCreateOrg();
  const updateOrg = useUpdateOrg();
  const deleteOrg = useDeleteOrg();
  const bulkDeleteOrgs = useBulkDeleteOrgs();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<EntitySheetMode>("create");
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Org | null>(null);
  const [bulkDeleteState, setBulkDeleteState] = useState<{
    ids: string[];
    clearSelection: () => void;
  } | null>(null);

  const columns = useMemo(
    () =>
      getOrgsColumns({
        onView: (o) => {
          setSelectedOrg(o);
          setDrawerMode("view");
          setDrawerOpen(true);
        },
        onEdit: (o) => {
          setSelectedOrg(o);
          setDrawerMode("edit");
          setDrawerOpen(true);
        },
        onDelete: (o) => setDeleteTarget(o),
      }),
    [],
  );

  const handleSubmit = (formData: CreateOrg | UpdateOrg) => {
    if (drawerMode === "create") {
      createOrg.mutate(formData as CreateOrg, {
        onSuccess: () => setDrawerOpen(false),
      });
    } else if (drawerMode === "edit" && selectedOrg) {
      updateOrg.mutate(
        { id: selectedOrg.id, input: formData as UpdateOrg },
        { onSuccess: () => setDrawerOpen(false) },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteOrg.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleBulkDelete = () => {
    if (!bulkDeleteState || bulkDeleteState.ids.length === 0) return;
    bulkDeleteOrgs.mutate(bulkDeleteState.ids, {
      onSuccess: () => {
        bulkDeleteState.clearSelection();
        setBulkDeleteState(null);
      },
    });
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={orgs}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        searchKey="name"
        searchPlaceholder="Search organizations..."
        filterConfig={orgsFilters}
        emptyState={{
          icon: Building2,
          title: "No organizations found",
          description: "Add your first organization to get started.",
          action: {
            label: "Add Organization",
            onClick: () => {
              setSelectedOrg(null);
              setDrawerMode("create");
              setDrawerOpen(true);
            },
          },
        }}
        actions={
          <Button
            onClick={() => {
              setSelectedOrg(null);
              setDrawerMode("create");
              setDrawerOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Organization
          </Button>
        }
        renderSelectionActions={({ selectedRows, selectedCount, clearSelection }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-destructive hover:text-destructive"
            onClick={() => {
              setBulkDeleteState({
                ids: selectedRows.map((o) => o.id),
                clearSelection,
              });
            }}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete selected ({selectedCount})
          </Button>
        )}
      />

      {drawerOpen && (
        <OrgsDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          mode={drawerMode}
          org={selectedOrg}
          isLoading={createOrg.isPending || updateOrg.isPending}
          onSubmit={handleSubmit}
          onEdit={() => setDrawerMode("edit")}
          onDelete={() => {
            setDrawerOpen(false);
            setDeleteTarget(selectedOrg);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete organization"
        description={`Are you sure you want to delete ${deleteTarget?.name ?? "this organization"}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteOrg.isPending}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!bulkDeleteState}
        onOpenChange={(open) => !open && setBulkDeleteState(null)}
        title="Delete selected organizations"
        description={`Are you sure you want to delete ${bulkDeleteState?.ids.length ?? 0} organization${(bulkDeleteState?.ids.length ?? 0) !== 1 ? "s" : ""}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={bulkDeleteOrgs.isPending}
        onConfirm={handleBulkDelete}
      />
    </>
  );
}
