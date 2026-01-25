import { Prisma, type ExpenseTemplate } from "@prisma/client";

export function buildExpenseTemplate(
  overrides: Partial<ExpenseTemplate> = {}
): ExpenseTemplate {
  const base: ExpenseTemplate = {
    id: "expense-template-102",
    userId: "user-203",
    name: "Weekly groceries",
    accountId: "account-102",
    categoryId: "category-102",
    amount: new Prisma.Decimal(75),
    description: "Groceries and household items",
    notes: "Default weekly list",
    isDefault: false,
    createdAt: new Date("2024-02-03T10:00:00.000Z"),
    updatedAt: new Date("2024-02-03T10:00:00.000Z"),
  };
  return { ...base, ...overrides };
}
