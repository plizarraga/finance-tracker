import type { TransferTemplateInput } from "@/features/transfer-templates/schemas";

export function buildTransferTemplateInput(
  overrides: Partial<TransferTemplateInput> = {}
): TransferTemplateInput {
  const base: TransferTemplateInput = {
    name: "Monthly savings",
    fromAccountId: "11111111-1111-4111-8111-111111111111",
    toAccountId: "22222222-2222-4222-8222-222222222222",
    amount: 200,
    description: "Move to savings",
    notes: "Monthly transfer",
  };
  return { ...base, ...overrides };
}
