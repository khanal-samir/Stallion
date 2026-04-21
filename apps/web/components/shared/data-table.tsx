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

export interface DataTableFilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  columnId: string;
  label: string;
  type?: "select" | "text" | "number" | "dateRange";
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
  columns, // the column definitions, memoized by the parent component
  data, // the current page of data to display, memoized by the parent component
  pageCount, // total number of pages, calculated by the parent component based on the total row count and page size
  pageIndex, // the current page index (0-based), controlled by the parent component
  pageSize, // the number of rows per page, controlled by the parent component
  onPaginationChange, // callback to update the pagination state in the parent component
  sorting = [], // the current sorting state, controlled by the parent component
  onSortingChange, // callback to update the sorting state in the parent component
  columnFilters = [], // the current column filters state, controlled by the parent component
  onColumnFiltersChange, // callback to update the column filters state in the parent component
  searchPlaceholder = "Search...",
  searchValue = "", // the current global search value, controlled by the parent component
  onSearchChange, // callback to update the global search value in the parent component
  filterConfig = [], // configuration for the filter dropdowns, memoized by the parent component
  isLoading = false,
  isError = false,
  errorTitle,
  errorDescription,
  onRetry,
  enableRowSelection = false,
  rowSelection = {}, // the current row selection state, controlled by the parent component
  onRowSelectionChange,
  getRowId, // optional function to generate unique row IDs, useful when your data doesn't have a stable ID field
  onRowClick,
  emptyTitle = "No results found",
  emptyDescription = "Try adjusting your filters or search to find what you're looking for.",
  toolbarActions, // optional additional actions to show in the toolbar, memoized by the parent component
  className,
}: DataTableProps<TData>) {
  // The only local state — column visibility doesn't affect server queries
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const pagination = { pageIndex, pageSize };
  const currentPage = pageCount === 0 ? 0 : pageIndex + 1;
  const canGoToPreviousPage = !isLoading && pageIndex > 0;
  const canGoToNextPage = !isLoading && pageIndex < pageCount - 1 && pageCount > 0;

  // adds a selection column to the left of the table when row selection is enabled
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

  // when row selection is enabled, add the selection column to the beginning of the columns array
  const resolvedColumns = React.useMemo(
    () => (enableRowSelection ? [selectionColumn, ...columns] : columns),
    [columns, enableRowSelection, selectionColumn],
  );

  // useReactTable manages the state and logic of the table, while we control the server interactions via the on*Change handlers
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

  // helper to get the current filter value for a column, used to set the value of the filter dropdowns
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

  // when the search input changes, update the search state and reset to the first page
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    onSearchChange?.(e.target.value);
    onPaginationChange({ ...pagination, pageIndex: 0 });
  }

  function updateFilterValue(columnId: string, value: unknown) {
    const next = columnFilters.filter((f) => f.id !== columnId);

    const shouldClear =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (typeof value === "object" &&
        value !== null &&
        "from" in value &&
        "to" in value &&
        !(value as { from?: string; to?: string }).from &&
        !(value as { from?: string; to?: string }).to);

    if (!shouldClear) {
      next.push({ id: columnId, value });
    }

    onColumnFiltersChange?.(next);
    onPaginationChange({ ...pagination, pageIndex: 0 });
  }

  function getDateRangeValue(columnId: string) {
    const value = getFilterValue(columnId);
    if (typeof value === "object" && value !== null && ("from" in value || "to" in value)) {
      const range = value as { from?: string; to?: string };
      return { from: range.from ?? "", to: range.to ?? "" };
    }

    return { from: "", to: "" };
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
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {onSearchChange && (
            <div className="relative min-w-60 flex-1 sm:max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="pl-8"
              />
            </div>
          )}

          {filterConfig.map((filter) =>
            filter.type === "text" ? (
              <Input
                key={filter.columnId}
                value={
                  typeof getFilterValue(filter.columnId) === "string"
                    ? (getFilterValue(filter.columnId) as string)
                    : ""
                }
                onChange={(event) => updateFilterValue(filter.columnId, event.target.value)}
                placeholder={filter.allLabel ?? filter.label}
                className="min-w-40"
              />
            ) : filter.type === "number" ? (
              <Input
                key={filter.columnId}
                type="number"
                step="any"
                value={
                  typeof getFilterValue(filter.columnId) === "string"
                    ? (getFilterValue(filter.columnId) as string)
                    : ""
                }
                onChange={(event) => updateFilterValue(filter.columnId, event.target.value)}
                placeholder={filter.allLabel ?? filter.label}
                className="min-w-32"
              />
            ) : filter.type === "dateRange" ? (
              <div
                key={filter.columnId}
                className="flex items-center gap-2 rounded-md border bg-background px-2 py-1"
              >
                <span className="text-xs text-muted-foreground">{filter.label}</span>
                <Input
                  type="date"
                  value={getDateRangeValue(filter.columnId).from}
                  onChange={(event) => {
                    const range = getDateRangeValue(filter.columnId);
                    updateFilterValue(filter.columnId, {
                      ...range,
                      from: event.target.value,
                    });
                  }}
                  className="h-8 w-36"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={getDateRangeValue(filter.columnId).to}
                  onChange={(event) => {
                    const range = getDateRangeValue(filter.columnId);
                    updateFilterValue(filter.columnId, {
                      ...range,
                      to: event.target.value,
                    });
                  }}
                  className="h-8 w-36"
                />
              </div>
            ) : (
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
            ),
          )}

          {selectedCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedCount} row{selectedCount === 1 ? "" : "s"} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
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
      <div className="overflow-hidden rounded-lg border bg-background">
        <Table>
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatColumnLabel(id: string) {
  return id
    .replace(/^_+/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .trim();
}

function getColumnLabel(id: string, header: unknown) {
  if (typeof header === "string") {
    return header;
  }

  return formatColumnLabel(id);
}

function getVisiblePageNumbers(pageIndex: number, pageCount: number): Array<number | "ellipsis"> {
  if (pageCount <= 0) return [];
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const current = pageIndex + 1;
  const pages: Array<number | "ellipsis"> = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(pageCount - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (current < pageCount - 2) pages.push("ellipsis");

  pages.push(pageCount);
  return pages;
}
