import { Prisma, type Expense } from "@prisma/client";
import { normalizeDescription } from "@/lib/normalize";

export function buildExpense(
  overrides: Partial<Expense> = {}
): Expense {
  const base: Expense = {
    id: "expense-102",
    userId: "user-203",
    accountId: "account-102",
    categoryId: "category-102",
    amount: new Prisma.Decimal(42.5),
    date: new Date("2024-02-03T00:00:00.000Z"),
    description: "Grocery run",
    descriptionNormalized: normalizeDescription("Grocery run"),
    notes: "Weekly staples",
    createdAt: new Date("2024-02-03T10:00:00.000Z"),
    updatedAt: new Date("2024-02-03T10:00:00.000Z"),
  };
  return { ...base, ...overrides };
}
