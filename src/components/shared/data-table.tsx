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
import { PAGE_SIZES } from "./table-constants";

const QUERY_KEYS = {
  page: "page",
  pageSize: "pageSize",
  sortBy: "sortBy",
  sortOrder: "sortOrder",
} as const;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  filterComponent?: React.ReactNode;
}

function isSameSorting(a: SortingState, b: SortingState) {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item.id === b[index].id && item.desc === b[index].desc);
}

function isSameFilters(a: ColumnFiltersState, b: ColumnFiltersState) {
  if (a.length !== b.length) return false;
  return a.every(
    (item, index) => item.id === b[index].id && item.value === b[index].value
  );
}

function getColumnId<TData, TValue>(column: ColumnDef<TData, TValue>) {
  if (column.id) return column.id;
  if ("accessorKey" in column && typeof column.accessorKey === "string") {
    return column.accessorKey;
  }
  return null;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  filterComponent,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialState = React.useMemo(() => {
    const rawPage = parseInt(searchParams.get(QUERY_KEYS.page) || "1", 10);
    const normalizedPage = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
    const maxPage = pageCount > 0 ? pageCount : normalizedPage;
    const page = Math.min(normalizedPage, maxPage);
    const rawPageSize = parseInt(
      searchParams.get(QUERY_KEYS.pageSize) || "25",
      10
    );
    const defaultPageSize = PAGE_SIZES.includes(25) ? 25 : PAGE_SIZES[0] || 25;
    const pageSize = PAGE_SIZES.includes(rawPageSize)
      ? rawPageSize
      : defaultPageSize;
    const columnIds = columns.map(getColumnId).filter(Boolean) as string[];
    const requestedSortBy = searchParams.get(QUERY_KEYS.sortBy) || "";
    const sortBy =
      (requestedSortBy && columnIds.includes(requestedSortBy)
        ? requestedSortBy
        : columnIds[0]) || "date";
    const rawSortOrder = searchParams.get(QUERY_KEYS.sortOrder);
    const sortOrder = rawSortOrder === "asc" || rawSortOrder === "desc" ? rawSortOrder : "desc";
    const filterableColumns = new Set(columns.map((col) => col.id).filter(Boolean));
    const columnFilters: ColumnFiltersState = [];

    for (const [key, value] of searchParams.entries()) {
      if (
        key !== QUERY_KEYS.page &&
        key !== QUERY_KEYS.pageSize &&
        key !== QUERY_KEYS.sortBy &&
        key !== QUERY_KEYS.sortOrder &&
        filterableColumns.has(key)
      ) {
        columnFilters.push({ id: key, value });
      }
    }

    return {
      sorting: [{ id: sortBy, desc: sortOrder === "desc" }] as SortingState,
      pagination: { pageIndex: page - 1, pageSize } as PaginationState,
      columnFilters,
    };
  }, [searchParams, columns, pageCount]);

  const [sorting, setSorting] = React.useState<SortingState>(
    initialState.sorting
  );
  const [pagination, setPagination] = React.useState<PaginationState>(
    initialState.pagination
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    initialState.columnFilters
  );

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

  // Sync state from URL (back/forward or external navigation)
  React.useEffect(() => {
    setSorting((prev) => {
      const next = initialState.sorting;
      return isSameSorting(prev, next) ? prev : next;
    });
    setPagination((prev) => {
      const next = initialState.pagination;
      return prev.pageIndex === next.pageIndex && prev.pageSize === next.pageSize
        ? prev
        : next;
    });
    setColumnFilters((prev) => {
      const next = initialState.columnFilters;
      return isSameFilters(prev, next) ? prev : next;
    });
  }, [initialState]);

  // Update URL when table state changes
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);

    // Update sorting
    if (sorting.length > 0) {
      params.set(QUERY_KEYS.sortBy, sorting[0].id);
      params.set(QUERY_KEYS.sortOrder, sorting[0].desc ? "desc" : "asc");
    }

    // Update pagination
    params.set(QUERY_KEYS.page, (pagination.pageIndex + 1).toString());
    params.set(QUERY_KEYS.pageSize, pagination.pageSize.toString());

    // Update filters
    const filterableColumns = new Set(columns.map((col) => col.id).filter(Boolean));
    for (const key of params.keys()) {
      if (
        key !== QUERY_KEYS.page &&
        key !== QUERY_KEYS.pageSize &&
        key !== QUERY_KEYS.sortBy &&
        key !== QUERY_KEYS.sortOrder &&
        filterableColumns.has(key)
      ) {
        params.delete(key);
      }
    }
    columnFilters.forEach((filter) => {
      if (filter.value !== undefined && filter.value !== "") {
        params.set(filter.id, String(filter.value));
      } else {
        params.delete(filter.id);
      }
    });

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      router.replace(`${pathname}?${nextQuery}`);
    }
  }, [sorting, pagination, columnFilters, pathname, router, searchParams, columns]);

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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-4">
        <PageSizeSelector
          pageSize={pagination.pageSize}
          onPageSizeChange={(pageSize) =>
            setPagination((prev) => ({
              ...prev,
              pageIndex: 0,
              pageSize,
            }))
          }
        />
        <Pagination
          currentPage={pagination.pageIndex + 1}
          totalPages={pageCount}
          pageSize={pagination.pageSize}
        />
      </div>
    </div>
  );
}
