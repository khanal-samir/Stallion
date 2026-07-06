"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getOrgsColumns } from "./org-columns";
import { ORGS_FILTER_CONFIG } from "./org-filters";
import { OrgDrawer } from "./org-drawer";
import { useOrgCustomFields } from "@/hooks/queries/use-crm-custom-fields";
import { useBulkDeleteOrgs, useDeleteOrg, useOrganizations } from "@/hooks/queries/use-org";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { useEntityDrawer } from "@/hooks/use-entity-drawer";
import { useEntityDelete } from "@/hooks/use-entity-delete";
import type { CustomFieldDefinition, Organization, OrganizationsListParams } from "@/types/crm";

export function OrgsDataTable() {
  const router = useRouter();
  const table = useDataTableState({ defaultPageSize: 50, debounceMs: 300 });
  const drawer = useEntityDrawer<Organization>();
  const deleteDialog = useEntityDelete<Organization>({ enableBulkDelete: true });

  const industryFilter = table.getFilterValue("industry") as string | undefined;
  const sizeFilter = table.getFilterValue("size") as string | undefined;

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

  const queryParams: OrganizationsListParams = {
    page: table.pagination.pageIndex + 1,
    pageSize: table.pagination.pageSize,
    ...(sortBy && {
      sortBy,
      sortOrder: activeSort?.desc ? "desc" : "asc",
    }),
    ...(table.debouncedSearch.trim() && { search: table.debouncedSearch.trim() }),
    ...(industryFilter && { industry: industryFilter }),
    ...(sizeFilter && { size: sizeFilter }),
  };

  const { data, isLoading, isError, refetch } = useOrganizations(queryParams);
  const { mutate: bulkDeleteMutate, isPending: isBulkDeleting } = useBulkDeleteOrgs();
  const { mutate: deleteOrgMutate, isPending: isDeleting } = useDeleteOrg();

  const org = data?.org ?? [];
  const totalCount = data?.meta.totalCount ?? 0;
  const pageCount = data?.meta.totalPages ?? 0;

  const selectedIds = Object.keys(table.rowSelection).filter((id) => table.rowSelection[id]);
  const selectedCount = selectedIds.length;
  const isDeletePending = isBulkDeleting || isDeleting;

  const columns = getOrgsColumns({
    onView: (org) => router.push(`/organizations/${org.id}`),
    onEdit: (org) => router.push(`/organizations/${org.id}?edit=true`),
    onDelete: (org) => deleteDialog.openDelete(org),
    customFields,
  });

  function handleConfirmDelete() {
    if (deleteDialog.isBulkDelete) {
      bulkDeleteMutate(
        { ids: selectedIds },
        {
          onSuccess: () => {
            table.resetRowSelection();
            deleteDialog.closeDelete();
          },
        },
      );
    } else if (deleteDialog.deleteTarget && deleteDialog.deleteTarget !== "bulk") {
      deleteOrgMutate(deleteDialog.deleteTarget.id, {
        onSuccess: () => deleteDialog.closeDelete(),
      });
    }
  }

  const toolbarActions =
    selectedCount > 0 ? (
      <Button
        variant="destructive"
        size="sm"
        onClick={deleteDialog.openBulkDelete}
        disabled={isDeletePending}
      >
        <Trash2 className="size-3.5" />
        Delete {selectedCount} selected
      </Button>
    ) : null;

  const confirmTitle = deleteDialog.isBulkDelete
    ? `Delete ${selectedCount} organization${selectedCount === 1 ? "" : "s"}?`
    : `Delete "${(deleteDialog.deleteTarget as Organization | null)?.name}"?`;

  const confirmDescription = deleteDialog.isBulkDelete
    ? `This will permanently remove ${selectedCount} organization${
        selectedCount === 1 ? "" : "s"
      }. People linked to ${selectedCount === 1 ? "it" : "them"} will have their organization cleared. This action cannot be undone.`
    : `This will permanently delete "${(deleteDialog.deleteTarget as Organization | null)?.name}". People linked to this organization will have their organization cleared. This action cannot be undone.`;

  return (
    <div data-tour="organizations-page">
      <PageHeader
        title="Organizations"
        description="Manage the companies you're tracking in your CRM."
        count={isLoading ? undefined : totalCount}
        actions={
          <Button
            size="sm"
            onClick={() => drawer.openDrawer("create")}
            data-tour="organizations-create"
          >
            <Plus className="size-3.5" />
            Add Organization
          </Button>
        }
      />

      <div data-tour="organizations-table">
        <DataTable
          columns={columns}
          data={org}
          pageCount={pageCount}
          pageIndex={table.pagination.pageIndex}
          pageSize={table.pagination.pageSize}
          onPaginationChange={table.onPaginationChange}
          sorting={table.sorting}
          onSortingChange={table.onSortingChange}
          columnFilters={table.columnFilters}
          onColumnFiltersChange={table.onColumnFiltersChange}
          searchValue={table.searchInput}
          onSearchChange={table.onSearchChange}
          searchPlaceholder="Search organizations…"
          filterConfig={ORGS_FILTER_CONFIG}
          isLoading={isLoading}
          isError={isError}
          errorTitle="Failed to load organizations"
          errorDescription="There was a problem fetching your organizations."
          onRetry={refetch}
          enableRowSelection
          rowSelection={table.rowSelection}
          onRowSelectionChange={table.onRowSelectionChange}
          getRowId={(row) => row.id}
          onRowClick={(org) => router.push(`/organizations/${org.id}`)}
          emptyTitle="No organizations yet"
          emptyDescription="Add your first organization to start tracking companies in your CRM."
          toolbarActions={toolbarActions}
        />
      </div>

      <OrgDrawer
        open={drawer.drawer.open}
        onOpenChange={drawer.onDrawerOpenChange}
        mode={drawer.drawer.mode}
        onModeChange={drawer.onDrawerModeChange}
        org={drawer.drawer.entity}
        customFields={customFields}
      />

      <ConfirmDialog
        open={deleteDialog.deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) deleteDialog.closeDelete();
        }}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Delete"
        variant="destructive"
        isPending={isDeletePending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
