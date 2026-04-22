import { useState, useCallback } from "react";
import { useDebounceValue } from "usehooks-ts";
import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";

export interface DataTableState {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  rowSelection: RowSelectionState;
  searchInput: string;
}

interface UseDataTableStateOptions {
  defaultPageSize?: number;
  debounceMs?: number;
}

export function useDataTableState(options: UseDataTableStateOptions = {}) {
  const { defaultPageSize = 50, debounceMs = 300 } = options;

  const [state, setState] = useState<DataTableState>({
    pagination: { pageIndex: 0, pageSize: defaultPageSize },
    sorting: [],
    columnFilters: [],
    rowSelection: {},
    searchInput: "",
  });

  const [debouncedSearch] = useDebounceValue(state.searchInput, debounceMs);

  const onPaginationChange = useCallback((pagination: PaginationState) => {
    setState((current) => ({ ...current, pagination }));
  }, []);

  const onSortingChange = useCallback((sorting: SortingState) => {
    setState((current) => ({
      ...current,
      sorting,
      pagination: { ...current.pagination, pageIndex: 0 }, // Reset to first page on sort change
    }));
  }, []);

  const onColumnFiltersChange = useCallback((columnFilters: ColumnFiltersState) => {
    setState((current) => ({ ...current, columnFilters }));
  }, []);

  const onSearchChange = useCallback((searchInput: string) => {
    setState((current) => ({ ...current, searchInput }));
  }, []);

  const onRowSelectionChange = useCallback((rowSelection: RowSelectionState) => {
    setState((current) => ({ ...current, rowSelection }));
  }, []);

  const resetRowSelection = useCallback(() => {
    setState((current) => ({ ...current, rowSelection: {} }));
  }, []);

  const getFilterValue = useCallback(
    (columnId: string) => state.columnFilters.find((f) => f.id === columnId)?.value,
    [state.columnFilters],
  );

  return {
    ...state,
    debouncedSearch,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onSearchChange,
    onRowSelectionChange,
    resetRowSelection,
    getFilterValue,
  };
}
