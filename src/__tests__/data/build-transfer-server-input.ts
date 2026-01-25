import { z } from "zod";

import { transferServerSchema } from "@/features/transfers/schemas";

export type TransferServerInput = z.input<typeof transferServerSchema>;

export function buildTransferServerInput(
  overrides: Partial<TransferServerInput> = {}
): TransferServerInput {
  const base: TransferServerInput = {
    fromAccountId: "11111111-1111-4111-8111-111111111111",
    toAccountId: "22222222-2222-4222-8222-222222222222",
    amount: "200",
    date: "2024-02-07",
    description: "Move to savings",
    notes: "Monthly transfer",
  };
  return { ...base, ...overrides };
}
