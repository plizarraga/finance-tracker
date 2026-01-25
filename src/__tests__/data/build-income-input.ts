import type { IncomeInput } from "@/features/incomes/schemas";

export function buildIncomeInput(
  overrides: Partial<IncomeInput> = {}
): IncomeInput {
  const base: IncomeInput = {
    accountId: "11111111-1111-4111-8111-111111111111",
    categoryId: "22222222-2222-4222-8222-222222222222",
    amount: 1250,
    date: new Date("2024-02-05T00:00:00.000Z"),
    description: "Monthly salary",
    notes: "Direct deposit",
  };
  return { ...base, ...overrides };
}
