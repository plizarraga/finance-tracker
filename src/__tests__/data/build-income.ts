import { Prisma, type Income } from "@prisma/client";
import { normalizeDescription } from "@/lib/normalize";

export function buildIncome(
  overrides: Partial<Income> = {}
): Income {
  const base: Income = {
    id: "income-102",
    userId: "user-203",
    accountId: "account-102",
    categoryId: "category-102",
    amount: new Prisma.Decimal(1250),
    date: new Date("2024-02-05T00:00:00.000Z"),
    description: "Monthly salary",
    descriptionNormalized: normalizeDescription("Monthly salary"),
    notes: "Direct deposit",
    createdAt: new Date("2024-02-05T10:00:00.000Z"),
    updatedAt: new Date("2024-02-05T10:00:00.000Z"),
  };
  return { ...base, ...overrides };
}
