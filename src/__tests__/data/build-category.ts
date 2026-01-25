import type { Category } from "@prisma/client";

export function buildCategory(
  overrides: Partial<Category> = {}
): Category {
  const base: Category = {
    id: "category-102",
    userId: "user-203",
    name: "Groceries",
    type: "expense",
    createdAt: new Date("2024-02-03T10:00:00.000Z"),
    updatedAt: new Date("2024-02-03T10:00:00.000Z"),
  };
  return { ...base, ...overrides };
}
