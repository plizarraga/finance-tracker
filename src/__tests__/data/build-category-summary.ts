export type CategorySummary = {
  id: string;
  name: string;
};

export function buildCategorySummary(
  overrides: Partial<CategorySummary> = {}
): CategorySummary {
  const base: CategorySummary = {
    id: "category-102",
    name: "Groceries",
  };
  return { ...base, ...overrides };
}
