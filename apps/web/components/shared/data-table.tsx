"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { Checkbox } from "@workspace/ui/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu";
import { Input } from "@workspace/ui/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@workspace/ui/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table";
import { cn } from "@workspace/ui/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { getColumnLabel, getVisiblePageNumbers } from "@/lib/data-table-utils";

export interface DataTableFilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  columnId: string;
  label: string;
  options?: DataTableFilterOption[];
  allLabel?: string;
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  pageCount: number;
  pageIndex: number;
  pageSize: number;
  onPaginationChange: (pagination: PaginationState) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (search: string) => void;
  filterConfig?: FilterConfig[];
  isLoading?: boolean;
  isError?: boolean;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
  onRowClick?: (row: TData) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbarActions?: React.ReactNode;
  className?: string;
}

export function DataTable<TData>({
  columns,
  data,
  pageCount,
  pageIndex,
  pageSize,
  onPaginationChange,
  sorting = [],
  onSortingChange,
  columnFilters = [],
  onColumnFiltersChange,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filterConfig = [],
  isLoading = false,
  isError = false,
  errorTitle,
  errorDescription,
  onRetry,
  enableRowSelection = false,
  rowSelection = {},
  onRowSelectionChange,
  getRowId,
  onRowClick,
  emptyTitle = "No results found",
  emptyDescription = "Try adjusting your filters or search to find what you're looking for.",
  toolbarActions,
  className,
}: DataTableProps<TData>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const pagination = { pageIndex, pageSize };
  const currentPage = pageCount === 0 ? 0 : pageIndex + 1;
  const canGoToPreviousPage = !isLoading && pageIndex > 0;
  const canGoToNextPage = !isLoading && pageIndex < pageCount - 1 && pageCount > 0;

  const selectionColumn = React.useMemo<ColumnDef<TData>>(
    () => ({
      id: "__select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
          }
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(!!checked)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 36,
    }),
    [],
  );

  const resolvedColumns = React.useMemo(
    () => (enableRowSelection ? [selectionColumn, ...columns] : columns),
    [columns, enableRowSelection, selectionColumn],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: resolvedColumns,
    pageCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection,
    state: {
      pagination,
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility,
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      onPaginationChange(next);
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange?.(next);
    },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnFilters) : updater;
      onColumnFiltersChange?.(next);
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange?.(next);
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
  });

  const selectedCount = table.getSelectedRowModel().rows.length;
  const visibleColumnsCount = table.getVisibleLeafColumns().length || resolvedColumns.length || 1;
  const hasRows = table.getRowModel().rows.length > 0;
  const pageNumbers = getVisiblePageNumbers(pageIndex, pageCount);

  function getFilterValue(columnId: string): unknown {
    const filter = columnFilters.find((f) => f.id === columnId);
    return filter?.value;
  }

  function updateFilter(columnId: string, value: string) {
    const next = columnFilters.filter((f) => f.id !== columnId);
    if (value !== "__all") next.push({ id: columnId, value });
    onColumnFiltersChange?.(next);
    onPaginationChange({ ...pagination, pageIndex: 0 });
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    onSearchChange?.(e.target.value);
    onPaginationChange({ ...pagination, pageIndex: 0 });
  }

  function handleRowClick(row: Row<TData>, e: React.MouseEvent<HTMLTableRowElement>) {
    if (!onRowClick) return;
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("[role='checkbox']") ||
      target.closest("a") ||
      target.closest("[data-row-action='true']")
    ) {
      return;
    }
    onRowClick(row.original);
  }

  return (
    <div className={cn("min-w-0 space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex min-w-0 flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {onSearchChange && (
            <div className="relative min-w-0 flex-1 sm:min-w-60 sm:max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="pl-8"
              />
            </div>
          )}

          {filterConfig.map((filter) => (
            <Select
              key={filter.columnId}
              value={
                typeof getFilterValue(filter.columnId) === "string"
                  ? (getFilterValue(filter.columnId) as string) || "__all"
                  : "__all"
              }
              onValueChange={(value) => updateFilter(filter.columnId, value)}
            >
              <SelectTrigger className="min-w-35">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">{filter.allLabel ?? `All ${filter.label}`}</SelectItem>
                {(filter.options ?? []).map((option) => (
                  <SelectItem key={`${filter.columnId}-${option.value}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {selectedCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedCount} row{selectedCount === 1 ? "" : "s"} selected
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {toolbarActions}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(checked) => col.toggleVisibility(!!checked)}
                    onSelect={(e) => e.preventDefault()}
                    className="capitalize"
                  >
                    {getColumnLabel(col.id, col.columnDef.header)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-hidden rounded-lg border bg-background">
        <Table className="min-w-max">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 font-medium"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDir && (
                            <span className="text-xs text-muted-foreground">
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 8) || 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: visibleColumnsCount }).map((__, j) => (
                    <TableCell key={`skeleton-${i}-${j}`}>
                      <Skeleton className="h-4 w-4/5" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={visibleColumnsCount} className="p-0">
                  <ErrorState
                    title={errorTitle}
                    description={errorDescription}
                    onRetry={onRetry}
                    className="py-14"
                  />
                </TableCell>
              </TableRow>
            ) : hasRows ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={(e) => handleRowClick(row, e)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumnsCount} className="p-0">
                  <EmptyState
                    icon={Inbox}
                    title={emptyTitle}
                    description={emptyDescription}
                    className="py-14"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {pageCount}
        </p>

        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onPaginationChange({ ...pagination, pageIndex: 0 })}
                disabled={!canGoToPreviousPage || pageCount <= 1}
                aria-label="First page"
              >
                <ChevronsLeft className="size-4" />
              </Button>
            </PaginationItem>

            <PaginationItem>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onPaginationChange({ ...pagination, pageIndex: pageIndex - 1 })}
                disabled={!canGoToPreviousPage}
                aria-label="Previous page"
              >
                <ChevronDown className="size-4 rotate-90" />
              </Button>
            </PaginationItem>

            {pageNumbers.map((num, i) =>
              num === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <Button variant="ghost" size="icon-sm" disabled>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </PaginationItem>
              ) : (
                <PaginationItem key={num}>
                  <PaginationLink
                    href="#"
                    isActive={num === pageIndex + 1}
                    size="icon-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      onPaginationChange({ ...pagination, pageIndex: num - 1 });
                    }}
                  >
                    {num}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onPaginationChange({ ...pagination, pageIndex: pageIndex + 1 })}
                disabled={!canGoToNextPage}
                aria-label="Next page"
              >
                <ChevronDown className="size-4 -rotate-90" />
              </Button>
            </PaginationItem>

            <PaginationItem>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onPaginationChange({ ...pagination, pageIndex: pageCount - 1 })}
                disabled={!canGoToNextPage}
                aria-label="Last page"
              >
                <ChevronsRight className="size-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
