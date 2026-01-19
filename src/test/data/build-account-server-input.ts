import { z } from "zod";

import { accountServerSchema } from "@/features/accounts/schemas";

export type AccountServerInput = z.input<typeof accountServerSchema>;

export function buildAccountServerInput(
  overrides: Partial<AccountServerInput> = {}
): AccountServerInput {
  const base: AccountServerInput = {
    name: "Payroll Account",
    description: "Operating cash for payroll",
    initialBalance: "3000",
  };
  return { ...base, ...overrides };
}
