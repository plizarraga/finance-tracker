import type { ExpenseInput } from "@/features/expenses/schemas";

export function buildExpenseInput(
  overrides: Partial<ExpenseInput> = {}
): ExpenseInput {
  const base: ExpenseInput = {
    accountId: "11111111-1111-4111-8111-111111111111",
    categoryId: "22222222-2222-4222-8222-222222222222",
    amount: 42.5,
    date: new Date("2024-02-03T00:00:00.000Z"),
    description: "Grocery run",
    notes: "Weekly staples",
  };
  return { ...base, ...overrides };
}
