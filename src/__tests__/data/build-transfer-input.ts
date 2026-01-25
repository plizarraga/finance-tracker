import type { TransferInput } from "@/features/transfers/schemas";

export function buildTransferInput(
  overrides: Partial<TransferInput> = {}
): TransferInput {
  const base: TransferInput = {
    fromAccountId: "11111111-1111-4111-8111-111111111111",
    toAccountId: "22222222-2222-4222-8222-222222222222",
    amount: 200,
    date: new Date("2024-02-07T00:00:00.000Z"),
    description: "Move to savings",
    notes: "Monthly transfer",
  };
  return { ...base, ...overrides };
}
