import { Prisma, type IncomeTemplate } from "@prisma/client";

export function buildIncomeTemplate(
  overrides: Partial<IncomeTemplate> = {}
): IncomeTemplate {
  const base: IncomeTemplate = {
    id: "income-template-102",
    userId: "user-203",
    name: "Monthly salary",
    accountId: "account-102",
    categoryId: "category-102",
    amount: new Prisma.Decimal(3500),
    description: "Primary salary",
    notes: "Net amount",
    isDefault: false,
    createdAt: new Date("2024-02-05T10:00:00.000Z"),
    updatedAt: new Date("2024-02-05T10:00:00.000Z"),
  };
  return { ...base, ...overrides };
}
