import type { AccountInput } from "@/features/accounts/schemas";

export function buildAccountInput(
  overrides: Partial<AccountInput> = {}
): AccountInput {
  const base: AccountInput = {
    name: "Checking Account",
    description: "Primary household account",
    initialBalance: 1250,
  };
  return { ...base, ...overrides };
}
