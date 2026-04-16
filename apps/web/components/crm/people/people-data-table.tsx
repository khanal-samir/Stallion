"use client";

import { useState } from "react";
import type { ColumnFiltersState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { getPeopleColumns } from "./people-columns";
import { PEOPLE_FILTER_CONFIG } from "./people-filters";
import { PeopleDrawer } from "./people-drawer";
import { usePeople, useDeletePerson, useBulkDeletePeople } from "@/hooks/queries/use-people";
import { useDebounceValue } from "usehooks-ts";
import type { EntitySheetMode } from "@/components/shared/entity-sheet";
import type { Person, PeopleListParams } from "@/types/crm";

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawerState = {
  open: boolean;
  mode: EntitySheetMode;
  person?: Person;
};

// A Person = single delete, "bulk" = bulk delete
type DeleteTarget = Person | "bulk" | null;

type PeopleTableState = {
  pagination: { pageIndex: number; pageSize: number };
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  rowSelection: RowSelectionState;
  searchInput: string;
};

type PeopleUiState = {
  drawer: DrawerState;
  deleteTarget: DeleteTarget;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PeopleDataTable() {
  const [table, setTable] = useState<PeopleTableState>({
    pagination: { pageIndex: 0, pageSize: 25 },
    sorting: [],
    columnFilters: [],
    rowSelection: {},
    searchInput: "",
  });
  const [ui, setUi] = useState<PeopleUiState>({
    drawer: { open: false, mode: "view" },
    deleteTarget: null,
  });

  // Debounce search to avoid a query on every keystroke
  const [debouncedSearch] = useDebounceValue(table.searchInput, 350);

  // Extract individual filter values from the TanStack ColumnFiltersState
  const statusFilter = table.columnFilters.find((f) => f.id === "status")?.value as
    | string
    | undefined;
  const sourceFilter = table.columnFilters.find((f) => f.id === "source")?.value as
    | string
    | undefined;

  const queryParams: PeopleListParams = {
    page: table.pagination.pageIndex + 1,
    pageSize: table.pagination.pageSize,
    ...(table.sorting[0] && {
      sortBy: table.sorting[0].id as PeopleListParams["sortBy"],
      sortOrder: table.sorting[0].desc ? "desc" : "asc",
    }),
    ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    ...(statusFilter && { status: statusFilter as PeopleListParams["status"] }),
    ...(sourceFilter && { source: sourceFilter as PeopleListParams["source"] }),
  };

  // Data
  const { data, isLoading, isError, refetch } = usePeople(queryParams);
  const people = data?.people ?? [];
  const totalCount = data?.meta.totalCount ?? 0;
  const pageCount = data?.meta.totalPages ?? 0;

  // Mutations
  const { mutate: deletePerson, isPending: isDeleting } = useDeletePerson();
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useBulkDeletePeople();

  // Selected row IDs (row keys come from getRowId which returns person.id)
  const selectedIds = Object.entries(table.rowSelection)
    .filter(([, value]) => value)
    .map(([id]) => id);
  const selectedCount = selectedIds.length;

  function updateTable(next: Partial<PeopleTableState>) {
    setTable((current) => ({ ...current, ...next }));
  }

  function openDrawer(mode: EntitySheetMode, person?: Person) {
    setUi((current) => ({
      ...current,
      drawer: { open: true, mode, person },
    }));
  }

  function closeDrawer() {
    setUi((current) => ({
      ...current,
      drawer: { ...current.drawer, open: false },
    }));
  }

  const columns = getPeopleColumns({
    onView: (person) => openDrawer("view", person),
    onEdit: (person) => openDrawer("edit", person),
    onDelete: (person) => setUi((current) => ({ ...current, deleteTarget: person })),
  });

  // ─── Delete ──────────────────────────────────────────────────────────────────

  function handleDeleteConfirm() {
    if (ui.deleteTarget === "bulk") {
      bulkDelete(
        { ids: selectedIds },
        {
          onSuccess: () => {
            setTable((current) => ({ ...current, rowSelection: {} }));
            setUi((current) => ({ ...current, deleteTarget: null }));
          },
        },
      );
    } else if (ui.deleteTarget) {
      deletePerson(ui.deleteTarget.id, {
        onSuccess: () => setUi((current) => ({ ...current, deleteTarget: null })),
      });
    }
  }

  const isDeletePending = isDeleting || isBulkDeleting;

  const confirmDialogCopy =
    ui.deleteTarget === "bulk"
      ? {
          title: `Delete ${selectedCount} ${selectedCount === 1 ? "person" : "people"}?`,
          description: `This will permanently remove ${
            selectedCount === 1 ? "this person" : `these ${selectedCount} people`
          } from your CRM. This action cannot be undone.`,
        }
      : ui.deleteTarget
        ? {
            title: `Delete "${ui.deleteTarget.name}"?`,
            description: `This will permanently remove ${ui.deleteTarget.name} from your CRM. This action cannot be undone.`,
          }
        : { title: "", description: "" };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="People"
        count={isLoading ? undefined : totalCount}
        description="Manage your contacts, leads, and customers."
        actions={
          <Button size="sm" onClick={() => openDrawer("create")}>
            <Plus className="size-3.5" />
            Add Person
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={people}
        pageCount={pageCount}
        pageIndex={table.pagination.pageIndex}
        pageSize={table.pagination.pageSize}
        onPaginationChange={(pagination) => updateTable({ pagination })}
        sorting={table.sorting}
        onSortingChange={(next) => {
          setTable((current) => ({
            ...current,
            sorting: next,
            pagination: { ...current.pagination, pageIndex: 0 },
          }));
        }}
        columnFilters={table.columnFilters}
        onColumnFiltersChange={(columnFilters) => updateTable({ columnFilters })}
        searchValue={table.searchInput}
        onSearchChange={(searchInput) => updateTable({ searchInput })}
        searchPlaceholder="Search people…"
        filterConfig={PEOPLE_FILTER_CONFIG}
        isLoading={isLoading}
        isError={isError}
        errorTitle="Failed to load people"
        errorDescription="There was a problem loading your contacts. Please try again."
        onRetry={refetch}
        enableRowSelection
        rowSelection={table.rowSelection}
        onRowSelectionChange={(rowSelection) => updateTable({ rowSelection })}
        getRowId={(row) => row.id}
        onRowClick={(person) => openDrawer("view", person)}
        emptyTitle="No people yet"
        emptyDescription="Add your first contact to get started."
        toolbarActions={
          selectedCount > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setUi((current) => ({ ...current, deleteTarget: "bulk" }))}
              disabled={isDeletePending}
            >
              <Trash2 className="size-3.5" />
              Delete {selectedCount} selected
            </Button>
          ) : null
        }
      />

      <PeopleDrawer
        open={ui.drawer.open}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
        mode={ui.drawer.mode}
        onModeChange={(mode) =>
          setUi((current) => ({ ...current, drawer: { ...current.drawer, mode } }))
        }
        person={ui.drawer.person}
      />

      <ConfirmDialog
        open={ui.deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUi((current) => ({ ...current, deleteTarget: null }));
        }}
        title={confirmDialogCopy.title}
        description={confirmDialogCopy.description}
        confirmLabel={isDeletePending ? "Deleting…" : "Delete"}
        variant="destructive"
        isPending={isDeletePending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
