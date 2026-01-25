import type { CategoryBreakdown } from "@/types";

export function buildCategoryBreakdown(
  overrides: Partial<CategoryBreakdown> = {}
): CategoryBreakdown {
  const base: CategoryBreakdown = {
    categoryId: "category-102",
    categoryName: "Groceries",
    total: 75,
    percentage: 50,
  };
  return { ...base, ...overrides };
}
