import { Prisma, type Account } from "@prisma/client";

export function buildAccount(
  overrides: Partial<Account> = {}
): Account {
  const base: Account = {
    id: "account-102",
    userId: "user-203",
    name: "Checking",
    description: "Primary account for bills",
    initialBalance: new Prisma.Decimal(1250),
    createdAt: new Date("2024-02-03T10:00:00.000Z"),
    updatedAt: new Date("2024-02-03T10:00:00.000Z"),
  };
  return { ...base, ...overrides };
}
