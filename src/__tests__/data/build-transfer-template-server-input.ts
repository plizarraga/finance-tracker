import { z } from "zod";

import { transferTemplateServerSchema } from "@/features/transfer-templates/schemas";

export type TransferTemplateServerInput = z.input<typeof transferTemplateServerSchema>;

export function buildTransferTemplateServerInput(
  overrides: Partial<TransferTemplateServerInput> = {}
): TransferTemplateServerInput {
  const base: TransferTemplateServerInput = {
    name: "Monthly savings",
    fromAccountId: "11111111-1111-4111-8111-111111111111",
    toAccountId: "22222222-2222-4222-8222-222222222222",
    amount: "200",
    description: "Move to savings",
    notes: "Monthly transfer",
  };
  return { ...base, ...overrides };
}
