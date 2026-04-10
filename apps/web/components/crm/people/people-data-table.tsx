"use client";

import { useCallback, useMemo, useState } from "react";
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
import { useDebounce } from "@/hooks/use-debounce";
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

// ─── Component ────────────────────────────────────────────────────────────────

export function PeopleDataTable() {
  // Table state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchInput, setSearchInput] = useState("");

  // UI state
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, mode: "view" });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  // Debounce search to avoid a query on every keystroke
  const debouncedSearch = useDebounce(searchInput, 350);

  // Extract individual filter values from the TanStack ColumnFiltersState
  const statusFilter = columnFilters.find((f) => f.id === "status")?.value as
    | string
    | undefined;
  const sourceFilter = columnFilters.find((f) => f.id === "source")?.value as
    | string
    | undefined;

  // Build the API query params from all state slices
  const queryParams = useMemo<PeopleListParams>(
    () => ({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      ...(sorting[0] && {
        sortBy: sorting[0].id as PeopleListParams["sortBy"],
        sortOrder: sorting[0].desc ? "desc" : "asc",
      }),
      ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      ...(statusFilter && { status: statusFilter as PeopleListParams["status"] }),
      ...(sourceFilter && { source: sourceFilter as PeopleListParams["source"] }),
    }),
    [pagination, sorting, debouncedSearch, statusFilter, sourceFilter],
  );

  // Data
  const { data, isLoading, isError, refetch } = usePeople(queryParams);
  const people = data?.people ?? [];
  const totalCount = data?.meta.totalCount ?? 0;
  const pageCount = data?.meta.totalPages ?? 0;

  // Mutations
  const { mutate: deletePerson, isPending: isDeleting } = useDeletePerson();
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useBulkDeletePeople();

  // Selected row IDs (row keys come from getRowId which returns person.id)
  const selectedIds = useMemo(
    () => Object.entries(rowSelection).filter(([, v]) => v).map(([id]) => id),
    [rowSelection],
  );
  const selectedCount = selectedIds.length;

  // ─── Drawer helpers ──────────────────────────────────────────────────────────

  const openDrawer = useCallback((mode: EntitySheetMode, person?: Person) => {
    setDrawer({ open: true, mode, person });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer((prev) => ({ ...prev, open: false }));
  }, []);

  // ─── Columns (memoised so identity is stable across renders) ─────────────────

  const columns = useMemo(
    () =>
      getPeopleColumns({
        onView: (person) => openDrawer("view", person),
        onEdit: (person) => openDrawer("edit", person),
        onDelete: (person) => setDeleteTarget(person),
      }),
    [openDrawer],
  );

  // ─── Delete ──────────────────────────────────────────────────────────────────

  function handleDeleteConfirm() {
    if (deleteTarget === "bulk") {
      bulkDelete(
        { ids: selectedIds },
        {
          onSuccess: () => {
            setRowSelection({});
            setDeleteTarget(null);
          },
        },
      );
    } else if (deleteTarget) {
      deletePerson(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    }
  }

  const isDeletePending = isDeleting || isBulkDeleting;

  const confirmDialogCopy =
    deleteTarget === "bulk"
      ? {
          title: `Delete ${selectedCount} ${selectedCount === 1 ? "person" : "people"}?`,
          description: `This will permanently remove ${
            selectedCount === 1 ? "this person" : `these ${selectedCount} people`
          } from your CRM. This action cannot be undone.`,
        }
      : deleteTarget
        ? {
            title: `Delete "${deleteTarget.name}"?`,
            description: `This will permanently remove ${deleteTarget.name} from your CRM. This action cannot be undone.`,
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
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={(next) => {
          setSorting(next);
          setPagination((p) => ({ ...p, pageIndex: 0 }));
        }}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search people…"
        filterConfig={PEOPLE_FILTER_CONFIG}
        isLoading={isLoading}
        isError={isError}
        errorTitle="Failed to load people"
        errorDescription="There was a problem loading your contacts. Please try again."
        onRetry={refetch}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => row.id}
        onRowClick={(person) => openDrawer("view", person)}
        emptyTitle="No people yet"
        emptyDescription="Add your first contact to get started."
        toolbarActions={
          selectedCount > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteTarget("bulk")}
              disabled={isDeletePending}
            >
              <Trash2 className="size-3.5" />
              Delete {selectedCount} selected
            </Button>
          ) : null
        }
      />

      <PeopleDrawer
        open={drawer.open}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
        initialMode={drawer.mode}
        person={drawer.person}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
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
