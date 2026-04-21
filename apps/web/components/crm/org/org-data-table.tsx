"use client";

import { useState } from "react";
import type { ColumnFiltersState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getOrgsColumns } from "./org-columns";
import { ORGS_FILTER_CONFIG } from "./org-filters";
import { OrgDrawer } from "./org-drawer";
import { useOrgCustomFields } from "@/hooks/queries/use-crm-custom-fields";
import { useBulkDeleteOrgs, useDeleteOrg, useOrganizations } from "@/hooks/queries/use-org";
import { useDebounceValue } from "usehooks-ts";
import type { CustomFieldDefinition, Organization, OrganizationsListParams } from "@/types/crm";
import type { EntitySheetMode } from "@/components/shared/entity-sheet";

type DrawerState = {
  open: boolean;
  mode: EntitySheetMode;
  org?: Organization;
};

type OrgsTableState = {
  pagination: { pageIndex: number; pageSize: number };
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  searchInput: string;
  rowSelection: RowSelectionState;
};

type OrgsUiState = {
  drawer: DrawerState;
  deleteTarget: Organization | "bulk" | null;
};

export function OrgsDataTable() {
  const [table, setTable] = useState<OrgsTableState>({
    pagination: { pageIndex: 0, pageSize: 25 },
    sorting: [],
    columnFilters: [],
    searchInput: "",
    rowSelection: {},
  });
  const [ui, setUi] = useState<OrgsUiState>({
    drawer: { open: false, mode: "view" },
    deleteTarget: null,
  });

  // Debounced search value drives the query; raw input drives the input element
  const [debouncedSearch] = useDebounceValue(table.searchInput, 300);

  // Derive filter values from TanStack columnFilters
  const industryFilter = table.columnFilters.find((f) => f.id === "industry")?.value as
    | string
    | undefined;
  const sizeFilter = table.columnFilters.find((f) => f.id === "size")?.value as string | undefined;

  const { data: customFieldsData } = useOrgCustomFields();
  const customFields = (customFieldsData ?? []) as CustomFieldDefinition[];
  const nativeSortableColumns = new Set<OrganizationsListParams["sortBy"]>([
    "name",
    "domain",
    "industry",
    "size",
    "location",
    "createdAt",
    "updatedAt",
  ]);

  const activeSort = table.sorting[0];
  const sortBy =
    activeSort && nativeSortableColumns.has(activeSort.id as OrganizationsListParams["sortBy"])
      ? (activeSort.id as OrganizationsListParams["sortBy"])
      : undefined;

  // Build server query params
  const queryParams: OrganizationsListParams = {
    page: table.pagination.pageIndex + 1,
    pageSize: table.pagination.pageSize,
    ...(sortBy && {
      sortBy,
      sortOrder: activeSort?.desc ? "desc" : "asc",
    }),
    ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    ...(industryFilter && { industry: industryFilter }),
    ...(sizeFilter && { size: sizeFilter }),
  };

  // Data + mutations
  const { data, isLoading, isError, refetch } = useOrganizations(queryParams);
  const { mutate: bulkDeleteMutate, isPending: isBulkDeleting } = useBulkDeleteOrgs();
  const { mutate: deleteOrgMutate, isPending: isDeleting } = useDeleteOrg();

  const org = data?.org ?? [];
  const totalCount = data?.meta.totalCount ?? 0;
  const pageCount = data?.meta.totalPages ?? 0;

  const selectedIds = Object.keys(table.rowSelection).filter((id) => table.rowSelection[id]);
  const selectedCount = selectedIds.length;
  const isDeletePending = isBulkDeleting || isDeleting;

  function updateTable(next: Partial<OrgsTableState>) {
    setTable((current) => ({ ...current, ...next }));
  }

  function openDrawer(mode: EntitySheetMode, org?: Organization) {
    setUi((current) => ({
      ...current,
      drawer: { open: true, mode, org },
    }));
  }

  const columns = getOrgsColumns({
    onView: (org) => openDrawer("view", org),
    onEdit: (org) => openDrawer("edit", org),
    onDelete: (org) => setUi((current) => ({ ...current, deleteTarget: org })),
    customFields,
  });

  // Handlers
  function handleSortingChange(next: SortingState) {
    setTable((current) => ({
      ...current,
      sorting: next,
      pagination: { ...current.pagination, pageIndex: 0 },
    }));
  }

  function handleConfirmDelete() {
    if (ui.deleteTarget === "bulk") {
      bulkDeleteMutate(
        { ids: selectedIds },
        {
          onSuccess: () => {
            setTable((current) => ({ ...current, rowSelection: {} }));
            setUi((current) => ({ ...current, deleteTarget: null }));
          },
        },
      );
    } else if (ui.deleteTarget) {
      deleteOrgMutate(ui.deleteTarget.id, {
        onSuccess: () => setUi((current) => ({ ...current, deleteTarget: null })),
      });
    }
  }

  // Toolbar: only shows when rows are selected
  const toolbarActions =
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
    ) : null;

  // Confirm dialog copy
  const isBulkTarget = ui.deleteTarget === "bulk";
  const confirmTitle = isBulkTarget
    ? `Delete ${selectedCount} organization${selectedCount === 1 ? "" : "s"}?`
    : `Delete "${(ui.deleteTarget as Organization | null)?.name}"?`;

  const confirmDescription = isBulkTarget
    ? `This will permanently remove ${selectedCount} organization${
        selectedCount === 1 ? "" : "s"
      }. People linked to ${selectedCount === 1 ? "it" : "them"} will have their organization cleared. This action cannot be undone.`
    : `This will permanently delete "${(ui.deleteTarget as Organization | null)?.name}". People linked to this organization will have their organization cleared. This action cannot be undone.`;

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Manage the companies you're tracking in your CRM."
        count={isLoading ? undefined : totalCount}
        actions={
          <Button size="sm" onClick={() => openDrawer("create")}>
            <Plus className="size-3.5" />
            Add Organization
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={org}
        pageCount={pageCount}
        pageIndex={table.pagination.pageIndex}
        pageSize={table.pagination.pageSize}
        onPaginationChange={(pagination) => updateTable({ pagination })}
        sorting={table.sorting}
        onSortingChange={handleSortingChange}
        columnFilters={table.columnFilters}
        onColumnFiltersChange={(columnFilters) => updateTable({ columnFilters })}
        searchValue={table.searchInput}
        onSearchChange={(searchInput) => updateTable({ searchInput })}
        searchPlaceholder="Search organizations…"
        filterConfig={ORGS_FILTER_CONFIG}
        isLoading={isLoading}
        isError={isError}
        errorTitle="Failed to load organizations"
        errorDescription="There was a problem fetching your organizations."
        onRetry={refetch}
        enableRowSelection
        rowSelection={table.rowSelection}
        onRowSelectionChange={(rowSelection) => updateTable({ rowSelection })}
        getRowId={(row) => row.id}
        onRowClick={(org) => openDrawer("view", org)}
        emptyTitle="No organizations yet"
        emptyDescription="Add your first organization to start tracking companies in your CRM."
        toolbarActions={toolbarActions}
      />

      <OrgDrawer
        open={ui.drawer.open}
        onOpenChange={(open) =>
          setUi((current) => ({ ...current, drawer: { ...current.drawer, open } }))
        }
        mode={ui.drawer.mode}
        onModeChange={(mode) =>
          setUi((current) => ({ ...current, drawer: { ...current.drawer, mode } }))
        }
        org={ui.drawer.org}
        customFields={customFields}
      />

      <ConfirmDialog
        open={ui.deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUi((current) => ({ ...current, deleteTarget: null }));
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
