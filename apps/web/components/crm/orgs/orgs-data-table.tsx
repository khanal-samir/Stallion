"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnFiltersState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getOrgsColumns } from "./orgs-columns";
import { ORGS_FILTER_CONFIG } from "./orgs-filters";
import { OrgDrawer } from "./orgs-drawer";
import { useBulkDeleteOrgs, useDeleteOrg, useOrganizations } from "@/hooks/queries/use-orgs";
import { useDebounceValue } from "usehooks-ts";
import type { Organization, OrganizationsListParams } from "@/types/crm";
import type { EntitySheetMode } from "@/components/shared/entity-sheet";

// ─── Types ─────────────────────────────────────────────────────────────────

type DrawerState = {
  open: boolean;
  mode: EntitySheetMode;
  org?: Organization;
};

// ─── Component ──────────────────────────────────────────────────────────────

export function OrgsDataTable() {
  // Table state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchInput, setSearchInput] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Drawer / delete state
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, mode: "view" });
  const [deleteTarget, setDeleteTarget] = useState<Organization | "bulk" | null>(null);

  // Debounced search value drives the query; raw input drives the input element
  const [debouncedSearch] = useDebounceValue(searchInput, 300);

  // Derive filter values from TanStack columnFilters
  const industryFilter = columnFilters.find((f) => f.id === "industry")?.value as
    | string
    | undefined;
  const sizeFilter = columnFilters.find((f) => f.id === "size")?.value as string | undefined;

  // Build server query params
  const queryParams = useMemo<OrganizationsListParams>(
    () => ({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      ...(sorting[0] && {
        sortBy: sorting[0].id as OrganizationsListParams["sortBy"],
        sortOrder: sorting[0].desc ? "desc" : "asc",
      }),
      ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      ...(industryFilter && { industry: industryFilter }),
      ...(sizeFilter && { size: sizeFilter }),
    }),
    [pagination, sorting, debouncedSearch, industryFilter, sizeFilter],
  );

  // Data + mutations
  const { data, isLoading, isError, refetch } = useOrganizations(queryParams);
  const { mutate: bulkDeleteMutate, isPending: isBulkDeleting } = useBulkDeleteOrgs();
  const { mutate: deleteOrgMutate, isPending: isDeleting } = useDeleteOrg();

  const orgs = data?.orgs ?? [];
  const totalCount = data?.meta.totalCount ?? 0;
  const pageCount = data?.meta.totalPages ?? 0;

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedCount = selectedIds.length;
  const isDeletePending = isBulkDeleting || isDeleting;

  // Stable column callbacks (setters are always stable)
  const handleView = useCallback(
    (org: Organization) => setDrawer({ open: true, mode: "view", org }),
    [],
  );
  const handleEdit = useCallback(
    (org: Organization) => setDrawer({ open: true, mode: "edit", org }),
    [],
  );
  const handleDeleteRow = useCallback((org: Organization) => setDeleteTarget(org), []);

  const columns = useMemo(
    () => getOrgsColumns({ onView: handleView, onEdit: handleEdit, onDelete: handleDeleteRow }),
    [handleView, handleEdit, handleDeleteRow],
  );

  // Handlers
  function handleSortingChange(next: SortingState) {
    setSorting(next);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  function handleConfirmDelete() {
    if (deleteTarget === "bulk") {
      bulkDeleteMutate(
        { ids: selectedIds },
        {
          onSuccess: () => {
            setRowSelection({});
            setDeleteTarget(null);
          },
        },
      );
    } else if (deleteTarget) {
      deleteOrgMutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    }
  }

  // Toolbar: only shows when rows are selected
  const toolbarActions =
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
    ) : null;

  // Confirm dialog copy
  const isBulkTarget = deleteTarget === "bulk";
  const confirmTitle = isBulkTarget
    ? `Delete ${selectedCount} organization${selectedCount === 1 ? "" : "s"}?`
    : `Delete "${(deleteTarget as Organization | null)?.name}"?`;

  const confirmDescription = isBulkTarget
    ? `This will permanently remove ${selectedCount} organization${
        selectedCount === 1 ? "" : "s"
      }. People linked to ${selectedCount === 1 ? "it" : "them"} will have their organization cleared. This action cannot be undone.`
    : `This will permanently delete "${(deleteTarget as Organization | null)?.name}". People linked to this organization will have their organization cleared. This action cannot be undone.`;

  return (
    <>
      <PageHeader
        title="Organizations"
        count={isLoading ? undefined : totalCount}
        actions={
          <Button size="sm" onClick={() => setDrawer({ open: true, mode: "create" })}>
            <Plus className="size-3.5" />
            Add Organization
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={orgs}
        pageCount={pageCount}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search organizations…"
        filterConfig={ORGS_FILTER_CONFIG}
        isLoading={isLoading}
        isError={isError}
        errorTitle="Failed to load organizations"
        errorDescription="There was a problem fetching your organizations."
        onRetry={refetch}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => row.id}
        onRowClick={handleView}
        emptyTitle="No organizations yet"
        emptyDescription="Add your first organization to start tracking companies in your CRM."
        toolbarActions={toolbarActions}
      />

      <OrgDrawer
        open={drawer.open}
        onOpenChange={(open) => setDrawer((s) => ({ ...s, open }))}
        initialMode={drawer.mode}
        org={drawer.org}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Delete"
        variant="destructive"
        isPending={isDeletePending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
