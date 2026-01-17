export const PAGE_SIZES = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 10;

export const QUERY_KEYS = {
  page: "page",
  pageSize: "pageSize",
  sortBy: "sortBy",
  sortOrder: "sortOrder",
} as const;

export function isValidPageSize(value: number): value is PageSize {
  return (PAGE_SIZES as readonly number[]).includes(value);
}
