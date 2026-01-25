export type AccountSummary = {
  id: string;
  name: string;
};

export function buildAccountSummary(
  overrides: Partial<AccountSummary> = {}
): AccountSummary {
  const base: AccountSummary = {
    id: "account-102",
    name: "Savings",
  };
  return { ...base, ...overrides };
}
