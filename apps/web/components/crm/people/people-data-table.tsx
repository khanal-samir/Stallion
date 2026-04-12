"use client";

import { useState, useMemo } from "react";
import { Users, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
  useBulkDeletePeople,
} from "@/hooks/queries/use-people";
import { getPeopleColumns } from "./people-columns";
import { peopleFilters } from "./people-filters";
import { PeopleDrawer } from "./people-drawer";
import type { Person } from "@/services/people.service";
import type { CreatePerson, UpdatePerson } from "@workspace/validators/schemas/crm";
import type { EntitySheetMode } from "@/components/shared/entity-sheet";

interface PeopleDataTableProps {
  people: Person[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function PeopleDataTable({ people, isLoading, error, refetch }: PeopleDataTableProps) {
  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();
  const deletePerson = useDeletePerson();
  const bulkDeletePeople = useBulkDeletePeople();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<EntitySheetMode>("create");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [bulkDeleteState, setBulkDeleteState] = useState<{
    ids: string[];
    clearSelection: () => void;
  } | null>(null);

  const columns = useMemo(
    () =>
      getPeopleColumns({
        onView: (p) => {
          setSelectedPerson(p);
          setDrawerMode("view");
          setDrawerOpen(true);
        },
        onEdit: (p) => {
          setSelectedPerson(p);
          setDrawerMode("edit");
          setDrawerOpen(true);
        },
        onDelete: (p) => setDeleteTarget(p),
      }),
    [],
  );

  const handleSubmit = (formData: CreatePerson | UpdatePerson) => {
    if (drawerMode === "create") {
      createPerson.mutate(formData as CreatePerson, {
        onSuccess: () => setDrawerOpen(false),
      });
    } else if (drawerMode === "edit" && selectedPerson) {
      updatePerson.mutate(
        { id: selectedPerson.id, input: formData as UpdatePerson },
        { onSuccess: () => setDrawerOpen(false) },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deletePerson.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleBulkDelete = () => {
    if (!bulkDeleteState || bulkDeleteState.ids.length === 0) return;
    bulkDeletePeople.mutate(bulkDeleteState.ids, {
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
        data={people}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        searchKey="name"
        searchPlaceholder="Search people..."
        filterConfig={peopleFilters}
        emptyState={{
          icon: Users,
          title: "No people found",
          description: "Add your first person to get started.",
          action: {
            label: "Add Person",
            onClick: () => {
              setSelectedPerson(null);
              setDrawerMode("create");
              setDrawerOpen(true);
            },
          },
        }}
        actions={
          <Button
            onClick={() => {
              setSelectedPerson(null);
              setDrawerMode("create");
              setDrawerOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Person
          </Button>
        }
        renderSelectionActions={({ selectedRows, selectedCount, clearSelection }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-destructive hover:text-destructive"
            onClick={() => {
              setBulkDeleteState({
                ids: selectedRows.map((p) => p.id),
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
        <PeopleDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          mode={drawerMode}
          person={selectedPerson}
          isLoading={createPerson.isPending || updatePerson.isPending}
          onSubmit={handleSubmit}
          onEdit={() => setDrawerMode("edit")}
          onDelete={() => {
            setDrawerOpen(false);
            setDeleteTarget(selectedPerson);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete person"
        description={`Are you sure you want to delete ${deleteTarget?.name ?? "this person"}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deletePerson.isPending}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!bulkDeleteState}
        onOpenChange={(open) => !open && setBulkDeleteState(null)}
        title="Delete selected people"
        description={`Are you sure you want to delete ${bulkDeleteState?.ids.length ?? 0} person${(bulkDeleteState?.ids.length ?? 0) !== 1 ? "s" : ""}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={bulkDeletePeople.isPending}
        onConfirm={handleBulkDelete}
      />
    </>
  );
}
