import type { ExpenseTemplateInput } from "@/features/expense-templates/schemas";

export function buildExpenseTemplateInput(
  overrides: Partial<ExpenseTemplateInput> = {}
): ExpenseTemplateInput {
  const base: ExpenseTemplateInput = {
    name: "Weekly groceries",
    accountId: "11111111-1111-4111-8111-111111111111",
    categoryId: "22222222-2222-4222-8222-222222222222",
    amount: 75,
    description: "Groceries and household items",
    notes: "Default weekly list",
  };
  return { ...base, ...overrides };
}
