import { Prisma } from "@prisma/client";

export type AccountSum = {
  accountId: string;
  _sum: { amount: Prisma.Decimal | null };
};

export function buildAccountSum(
  overrides: Partial<AccountSum> = {}
): AccountSum {
  const base: AccountSum = {
    accountId: "account-102",
    _sum: { amount: new Prisma.Decimal(500) },
  };
  return { ...base, ...overrides };
}
