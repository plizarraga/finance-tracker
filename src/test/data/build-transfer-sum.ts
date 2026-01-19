import { Prisma } from "@prisma/client";

export type TransferInSum = {
  toAccountId: string;
  _sum: { amount: Prisma.Decimal | null };
};

export type TransferOutSum = {
  fromAccountId: string;
  _sum: { amount: Prisma.Decimal | null };
};

export function buildTransferInSum(
  overrides: Partial<TransferInSum> = {}
): TransferInSum {
  const base: TransferInSum = {
    toAccountId: "account-102",
    _sum: { amount: new Prisma.Decimal(75) },
  };
  return { ...base, ...overrides };
}

export function buildTransferOutSum(
  overrides: Partial<TransferOutSum> = {}
): TransferOutSum {
  const base: TransferOutSum = {
    fromAccountId: "account-102",
    _sum: { amount: new Prisma.Decimal(40) },
  };
  return { ...base, ...overrides };
}
