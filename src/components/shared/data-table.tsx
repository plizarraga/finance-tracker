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
import { PAGE_SIZES, DEFAULT_PAGE_SIZE, QUERY_KEYS, isValidPageSize } from "./table-constants";

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
  const sortBy = columnIds.includes(requestedSortBy) ? requestedSortBy : columnIds[0] || "date";
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

  const [sorting, setSorting] = React.useState<SortingState>(urlState.sorting);
  const [pagination, setPagination] = React.useState<PaginationState>(urlState.pagination);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    urlState.columnFilters
  );

  // Track if state change is from URL sync (to prevent circular updates)
  const isUrlSyncRef = React.useRef(false);

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

  // Sync state from URL when back/forward navigation occurs
  React.useEffect(() => {
    const newSorting = urlState.sorting;
    const newPagination = urlState.pagination;
    const newFilters = urlState.columnFilters;

    const sortingChanged =
      sorting.length !== newSorting.length ||
      sorting.some((s, i) => s.id !== newSorting[i]?.id || s.desc !== newSorting[i]?.desc);

    const paginationChanged =
      pagination.pageIndex !== newPagination.pageIndex ||
      pagination.pageSize !== newPagination.pageSize;

    const filtersChanged =
      columnFilters.length !== newFilters.length ||
      columnFilters.some((f, i) => f.id !== newFilters[i]?.id || f.value !== newFilters[i]?.value);

    if (sortingChanged || paginationChanged || filtersChanged) {
      isUrlSyncRef.current = true;
      if (sortingChanged) setSorting(newSorting);
      if (paginationChanged) setPagination(newPagination);
      if (filtersChanged) setColumnFilters(newFilters);
    }
  }, [urlState, sorting, pagination, columnFilters]);

  // Update URL when table state changes
  React.useEffect(() => {
    // Skip URL update if this was triggered by URL sync
    if (isUrlSyncRef.current) {
      isUrlSyncRef.current = false;
      return;
    }

    const params = buildUrlParams(
      sorting,
      pagination,
      columnFilters,
      filterableColumns,
      searchParams
    );

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery !== currentQuery) {
      router.replace(`${pathname}?${nextQuery}`);
    }
  }, [sorting, pagination, columnFilters, filterableColumns, pathname, router, searchParams]);

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
      {filterComponent}
      <div className="rounded-md border">
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
      <div className="flex items-center justify-between gap-4">
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
