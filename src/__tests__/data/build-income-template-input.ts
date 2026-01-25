import type { IncomeTemplateInput } from "@/features/income-templates/schemas";

export function buildIncomeTemplateInput(
  overrides: Partial<IncomeTemplateInput> = {}
): IncomeTemplateInput {
  const base: IncomeTemplateInput = {
    name: "Monthly salary",
    accountId: "11111111-1111-4111-8111-111111111111",
    categoryId: "22222222-2222-4222-8222-222222222222",
    amount: 3500,
    description: "Primary salary",
    notes: "Net amount",
  };
  return { ...base, ...overrides };
}
