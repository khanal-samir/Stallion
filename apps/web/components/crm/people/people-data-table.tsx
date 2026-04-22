"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { getPeopleColumns } from "./people-columns";
import { PEOPLE_FILTER_CONFIG } from "./people-filters";
import { PeopleDrawer } from "./people-drawer";
import { usePeople, useDeletePerson, useBulkDeletePeople } from "@/hooks/queries/use-people";
import { usePeopleCustomFields } from "@/hooks/queries/use-crm-custom-fields";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { useEntityDrawer } from "@/hooks/use-entity-drawer";
import { useEntityDelete } from "@/hooks/use-entity-delete";
import type { CustomFieldDefinition, Person, PeopleListParams } from "@/types/crm";

export function PeopleDataTable() {
  const table = useDataTableState({ defaultPageSize: 25, debounceMs: 350 });
  const drawer = useEntityDrawer<Person>();
  const deleteDialog = useEntityDelete<Person>({ enableBulkDelete: true });

  const statusFilter = table.getFilterValue("status") as string | undefined;
  const sourceFilter = table.getFilterValue("source") as string | undefined;

  const { data: customFieldsData } = usePeopleCustomFields();
  const customFields = (customFieldsData ?? []) as CustomFieldDefinition[];
  const nativeSortableColumns = new Set<PeopleListParams["sortBy"]>([
    "name",
    "email",
    "phone",
    "jobTitle",
    "status",
    "source",
    "lastContactedAt",
    "createdAt",
    "updatedAt",
  ]);

  const activeSort = table.sorting[0];
  const sortBy =
    activeSort && nativeSortableColumns.has(activeSort.id as PeopleListParams["sortBy"])
      ? (activeSort.id as PeopleListParams["sortBy"])
      : undefined;

  const queryParams: PeopleListParams = {
    page: table.pagination.pageIndex + 1,
    pageSize: table.pagination.pageSize,
    ...(sortBy && {
      sortBy,
      sortOrder: activeSort?.desc ? "desc" : "asc",
    }),
    ...(table.debouncedSearch.trim() && { search: table.debouncedSearch.trim() }),
    ...(statusFilter && { status: statusFilter as PeopleListParams["status"] }),
    ...(sourceFilter && { source: sourceFilter as PeopleListParams["source"] }),
  };

  const { data, isLoading, isError, refetch } = usePeople(queryParams);
  const people = data?.people ?? [];
  const totalCount = data?.meta.totalCount ?? 0;
  const pageCount = data?.meta.totalPages ?? 0;

  const { mutate: deletePerson, isPending: isDeleting } = useDeletePerson();
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useBulkDeletePeople();

  const selectedIds = Object.entries(table.rowSelection)
    .filter(([, value]) => value)
    .map(([id]) => id);
  const selectedCount = selectedIds.length;

  const columns = getPeopleColumns({
    onView: (person) => drawer.openDrawer("view", person),
    onEdit: (person) => drawer.openDrawer("edit", person),
    onDelete: (person) => deleteDialog.openDelete(person),
    customFields,
  });

  function handleDeleteConfirm() {
    if (deleteDialog.isBulkDelete) {
      bulkDelete(
        { ids: selectedIds },
        {
          onSuccess: () => {
            table.resetRowSelection();
            deleteDialog.closeDelete();
          },
        },
      );
    } else if (deleteDialog.deleteTarget && deleteDialog.deleteTarget !== "bulk") {
      deletePerson(deleteDialog.deleteTarget.id, {
        onSuccess: () => deleteDialog.closeDelete(),
      });
    }
  }

  const isDeletePending = isDeleting || isBulkDeleting;

  const confirmDialogCopy =
    deleteDialog.deleteTarget && deleteDialog.deleteTarget !== "bulk"
      ? {
          title: `Delete "${deleteDialog.deleteTarget.name}"?`,
          description: `This will permanently remove ${deleteDialog.deleteTarget.name} from your CRM. This action cannot be undone.`,
        }
      : deleteDialog.isBulkDelete
        ? {
            title: `Delete ${selectedCount} ${selectedCount === 1 ? "person" : "people"}?`,
            description: `This will permanently remove ${
              selectedCount === 1 ? "this person" : `these ${selectedCount} people`
            } from your CRM. This action cannot be undone.`,
          }
        : { title: "", description: "" };

  return (
    <div>
      <PageHeader
        title="People"
        count={isLoading ? undefined : totalCount}
        description="Manage your contacts, leads, and customers."
        actions={
          <Button size="sm" onClick={() => drawer.openDrawer("create")}>
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
        onPaginationChange={table.onPaginationChange}
        sorting={table.sorting}
        onSortingChange={table.onSortingChange}
        columnFilters={table.columnFilters}
        onColumnFiltersChange={table.onColumnFiltersChange}
        searchValue={table.searchInput}
        onSearchChange={table.onSearchChange}
        searchPlaceholder="Search people…"
        filterConfig={PEOPLE_FILTER_CONFIG}
        isLoading={isLoading}
        isError={isError}
        errorTitle="Failed to load people"
        errorDescription="There was a problem loading your contacts. Please try again."
        onRetry={refetch}
        enableRowSelection
        rowSelection={table.rowSelection}
        onRowSelectionChange={table.onRowSelectionChange}
        getRowId={(row) => row.id}
        onRowClick={(person) => drawer.openDrawer("view", person)}
        emptyTitle="No people yet"
        emptyDescription="Add your first contact to get started."
        toolbarActions={
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
          ) : null
        }
      />

      <PeopleDrawer
        open={drawer.drawer.open}
        onOpenChange={drawer.onDrawerOpenChange}
        mode={drawer.drawer.mode}
        onModeChange={drawer.onDrawerModeChange}
        person={drawer.drawer.entity}
        customFields={customFields}
      />

      <ConfirmDialog
        open={deleteDialog.deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) deleteDialog.closeDelete();
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
