import { Prisma, type Transfer } from "@prisma/client";

export function buildTransfer(
  overrides: Partial<Transfer> = {}
): Transfer {
  const base: Transfer = {
    id: "transfer-102",
    userId: "user-203",
    fromAccountId: "account-102",
    toAccountId: "account-103",
    amount: new Prisma.Decimal(200),
    date: new Date("2024-02-07T00:00:00.000Z"),
    description: "Move to savings",
    notes: "Monthly transfer",
    createdAt: new Date("2024-02-07T10:00:00.000Z"),
    updatedAt: new Date("2024-02-07T10:00:00.000Z"),
  };
  return { ...base, ...overrides };
}
