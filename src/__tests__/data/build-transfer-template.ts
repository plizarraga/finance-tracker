import { Prisma, type TransferTemplate } from "@prisma/client";

export function buildTransferTemplate(
  overrides: Partial<TransferTemplate> = {}
): TransferTemplate {
  const base: TransferTemplate = {
    id: "transfer-template-102",
    userId: "user-203",
    name: "Monthly savings",
    fromAccountId: "account-102",
    toAccountId: "account-103",
    amount: new Prisma.Decimal(200),
    description: "Move to savings",
    notes: "Monthly transfer",
    isDefault: false,
    createdAt: new Date("2024-02-07T10:00:00.000Z"),
    updatedAt: new Date("2024-02-07T10:00:00.000Z"),
  };
  return { ...base, ...overrides };
}
