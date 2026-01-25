import { z } from "zod";

import { expenseServerSchema } from "@/features/expenses/schemas";

export type ExpenseServerInput = z.input<typeof expenseServerSchema>;

export function buildExpenseServerInput(
  overrides: Partial<ExpenseServerInput> = {}
): ExpenseServerInput {
  const base: ExpenseServerInput = {
    accountId: "11111111-1111-4111-8111-111111111111",
    categoryId: "22222222-2222-4222-8222-222222222222",
    amount: "42.5",
    date: "2024-02-03",
    description: "Grocery run",
    notes: "Weekly staples",
  };
  return { ...base, ...overrides };
}
