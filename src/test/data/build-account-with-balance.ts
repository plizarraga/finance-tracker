import type { AccountWithBalance } from "@/types";

import { buildAccount } from "@/test/data/build-account";

export function buildAccountWithBalance(
  overrides: Partial<AccountWithBalance> = {}
): AccountWithBalance {
  const base: AccountWithBalance = {
    ...buildAccount(),
    balance: 250,
  };
  return { ...base, ...overrides };
}
