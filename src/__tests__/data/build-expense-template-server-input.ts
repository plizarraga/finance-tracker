import { z } from "zod";

import { expenseTemplateServerSchema } from "@/features/expense-templates/schemas";

export type ExpenseTemplateServerInput = z.input<typeof expenseTemplateServerSchema>;

export function buildExpenseTemplateServerInput(
  overrides: Partial<ExpenseTemplateServerInput> = {}
): ExpenseTemplateServerInput {
  const base: ExpenseTemplateServerInput = {
    name: "Weekly groceries",
    accountId: "11111111-1111-4111-8111-111111111111",
    categoryId: "22222222-2222-4222-8222-222222222222",
    amount: "75",
    description: "Groceries and household items",
    notes: "Default weekly list",
  };
  return { ...base, ...overrides };
}
