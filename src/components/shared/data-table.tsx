"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "./pagination";
import { PageSizeSelector } from "./page-size-selector";
import { DEFAULT_PAGE_SIZE, QUERY_KEYS, isValidPageSize } from "./table-constants";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  totalCount?: number;
  filterComponent?: React.ReactNode;
}

function parseUrlState(
  searchParams: URLSearchParams,
  columns: ColumnDef<unknown, unknown>[],
  pageCount: number
): {
  sorting: SortingState;
  pagination: PaginationState;
  columnFilters: ColumnFiltersState;
} {
  // Parse pagination
  const rawPage = parseInt(searchParams.get(QUERY_KEYS.page) || "1", 10);
  const normalizedPage = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
  const maxPage = Math.max(pageCount, 1);
  const page = Math.min(normalizedPage, maxPage);

  const rawPageSize = parseInt(
    searchParams.get(QUERY_KEYS.pageSize) || String(DEFAULT_PAGE_SIZE),
    10
  );
  const pageSize = isValidPageSize(rawPageSize) ? rawPageSize : DEFAULT_PAGE_SIZE;

  // Parse sorting
  const columnIds = columns
    .map((col) => col.id || ("accessorKey" in col ? String(col.accessorKey) : null))
    .filter(Boolean) as string[];
  const requestedSortBy = searchParams.get(QUERY_KEYS.sortBy) || "";
  const defaultSortBy = columnIds.includes("date") ? "date" : columnIds[0] || "date";
  const sortBy = columnIds.includes(requestedSortBy) ? requestedSortBy : defaultSortBy;
  const rawSortOrder = searchParams.get(QUERY_KEYS.sortOrder);
  const sortOrder = rawSortOrder === "asc" || rawSortOrder === "desc" ? rawSortOrder : "desc";

  // Parse column filters
  const filterableColumns = new Set(columns.map((col) => col.id).filter(Boolean));
  const columnFilters: ColumnFiltersState = [];

  for (const [key, value] of searchParams.entries()) {
    const isReservedKey =
      key === QUERY_KEYS.page ||
      key === QUERY_KEYS.pageSize ||
      key === QUERY_KEYS.sortBy ||
      key === QUERY_KEYS.sortOrder;

    if (!isReservedKey && filterableColumns.has(key)) {
      columnFilters.push({ id: key, value });
    }
  }

  return {
    sorting: [{ id: sortBy, desc: sortOrder === "desc" }],
    pagination: { pageIndex: page - 1, pageSize },
    columnFilters,
  };
}

function buildUrlParams(
  sorting: SortingState,
  pagination: PaginationState,
  columnFilters: ColumnFiltersState,
  filterableColumns: Set<string>,
  currentParams: URLSearchParams
): URLSearchParams {
  const params = new URLSearchParams(currentParams);

  // Update sorting
  if (sorting.length > 0) {
    params.set(QUERY_KEYS.sortBy, sorting[0].id);
    params.set(QUERY_KEYS.sortOrder, sorting[0].desc ? "desc" : "asc");
  }

  // Update pagination
  params.set(QUERY_KEYS.page, (pagination.pageIndex + 1).toString());
  params.set(QUERY_KEYS.pageSize, pagination.pageSize.toString());

  // Clear existing filter params
  for (const key of [...params.keys()]) {
    const isReservedKey =
      key === QUERY_KEYS.page ||
      key === QUERY_KEYS.pageSize ||
      key === QUERY_KEYS.sortBy ||
      key === QUERY_KEYS.sortOrder;

    if (!isReservedKey && filterableColumns.has(key)) {
      params.delete(key);
    }
  }

  // Set new filter values
  for (const filter of columnFilters) {
    if (filter.value !== undefined && filter.value !== "") {
      params.set(filter.id, String(filter.value));
    }
  }

  return params;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  filterComponent,
}: DataTableProps<TData, TValue>): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Memoize filterable columns set
  const filterableColumns = React.useMemo(
    () => new Set(columns.map((col) => col.id).filter((id): id is string => Boolean(id))),
    [columns]
  );

  // Parse initial state from URL
  const urlState = React.useMemo(
    () => parseUrlState(searchParams, columns as ColumnDef<unknown, unknown>[], pageCount),
    [searchParams, columns, pageCount]
  );

  const shouldSyncSorting = React.useMemo(() => {
    const sortBy = searchParams.get(QUERY_KEYS.sortBy);
    const sortOrder = searchParams.get(QUERY_KEYS.sortOrder);
    const hasSortOrder = sortOrder === "asc" || sortOrder === "desc";
    return !sortBy || !hasSortOrder;
  }, [searchParams]);

  const [sorting, setSorting] = React.useState<SortingState>(urlState.sorting);
  const [pagination, setPagination] = React.useState<PaginationState>(urlState.pagination);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    urlState.columnFilters
  );

  // Track if we should ignore URL updates
  const ignoreNextUpdateRef = React.useRef(false);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table hook is required here.
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      pagination,
      columnFilters,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  // When the URL changes from outside (back/forward), sync the state
  React.useEffect(() => {
    const newUrlState = parseUrlState(searchParams, columns as ColumnDef<unknown, unknown>[], pageCount);

    const sortingDifferent =
      sorting.length !== newUrlState.sorting.length ||
      sorting.some((s, i) => s.id !== newUrlState.sorting[i]?.id || s.desc !== newUrlState.sorting[i]?.desc);

    const paginationDifferent =
      pagination.pageIndex !== newUrlState.pagination.pageIndex ||
      pagination.pageSize !== newUrlState.pagination.pageSize;

    const filtersDifferent =
      columnFilters.length !== newUrlState.columnFilters.length ||
      columnFilters.some((f, i) => f.id !== newUrlState.columnFilters[i]?.id || f.value !== newUrlState.columnFilters[i]?.value);

    if (sortingDifferent || paginationDifferent || filtersDifferent) {
      ignoreNextUpdateRef.current = true;
      if (sortingDifferent) setSorting(newUrlState.sorting);
      if (paginationDifferent) setPagination(newUrlState.pagination);
      if (filtersDifferent) setColumnFilters(newUrlState.columnFilters);
    }
  }, [searchParams, columns, pageCount]);

  // Ensure default sort is reflected in the URL when missing.
  React.useEffect(() => {
    if (!shouldSyncSorting) return;

    const params = buildUrlParams(
      urlState.sorting,
      urlState.pagination,
      urlState.columnFilters,
      filterableColumns,
      searchParams
    );
    const newQuery = params.toString();
    const currentQuery = searchParams.toString();

    if (newQuery !== currentQuery) {
      router.replace(`${pathname}?${newQuery}`, { scroll: false });
      router.refresh();
    }
  }, [
    shouldSyncSorting,
    urlState.sorting,
    urlState.pagination,
    urlState.columnFilters,
    filterableColumns,
    searchParams,
    pathname,
    router,
  ]);

  // When the table state changes, update the URL
  React.useEffect(() => {
    if (ignoreNextUpdateRef.current) {
      ignoreNextUpdateRef.current = false;
      return;
    }

    const params = buildUrlParams(sorting, pagination, columnFilters, filterableColumns, searchParams);
    const newQuery = params.toString();
    const currentQuery = searchParams.toString();

    if (newQuery !== currentQuery) {
      router.replace(`${pathname}?${newQuery}`, { scroll: false });
      router.refresh();
    }
  }, [sorting, pagination, columnFilters]);

  // Memoize page size change handler
  const handlePageSizeChange = React.useCallback((pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
      pageSize,
    }));
  }, []);

  return (
    <div className="space-y-4">
      {filterComponent && <div>{filterComponent}</div>}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-center gap-4 sm:justify-between">
        <PageSizeSelector pageSize={pagination.pageSize} onPageSizeChange={handlePageSizeChange} />
        <Pagination
          currentPage={pagination.pageIndex + 1}
          totalPages={pageCount}
          pageSize={pagination.pageSize}
        />
      </div>
    </div>
  );
}
