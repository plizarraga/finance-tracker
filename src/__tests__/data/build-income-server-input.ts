import { z } from "zod";

import { incomeServerSchema } from "@/features/incomes/schemas";

export type IncomeServerInput = z.input<typeof incomeServerSchema>;

export function buildIncomeServerInput(
  overrides: Partial<IncomeServerInput> = {}
): IncomeServerInput {
  const base: IncomeServerInput = {
    accountId: "11111111-1111-4111-8111-111111111111",
    categoryId: "22222222-2222-4222-8222-222222222222",
    amount: "1250",
    date: "2024-02-05",
    description: "Monthly salary",
    notes: "Direct deposit",
  };
  return { ...base, ...overrides };
}
