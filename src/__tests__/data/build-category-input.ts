import type { CategoryInput } from "@/features/categories/schemas";

export function buildCategoryInput(
  overrides: Partial<CategoryInput> = {}
): CategoryInput {
  const base: CategoryInput = {
    name: "Groceries",
    type: "expense",
  };
  return { ...base, ...overrides };
}
