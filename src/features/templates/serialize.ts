import type { Account } from "@prisma/client";

export type AccountSerialized = Omit<Account, "initialBalance"> & {
  initialBalance: number;
};

export function serializeAccount(
  account: Account | null
): AccountSerialized | null {
  if (!account) {
    return null;
  }

  return {
    ...account,
    initialBalance: account.initialBalance?.toNumber?.() ?? 0,
  };
}
