import { z } from "zod";

import { incomeTemplateServerSchema } from "@/features/income-templates/schemas";

export type IncomeTemplateServerInput = z.input<typeof incomeTemplateServerSchema>;

export function buildIncomeTemplateServerInput(
  overrides: Partial<IncomeTemplateServerInput> = {}
): IncomeTemplateServerInput {
  const base: IncomeTemplateServerInput = {
    name: "Monthly salary",
    accountId: "11111111-1111-4111-8111-111111111111",
    categoryId: "22222222-2222-4222-8222-222222222222",
    amount: "3500",
    description: "Primary salary",
    notes: "Net amount",
  };
  return { ...base, ...overrides };
}
