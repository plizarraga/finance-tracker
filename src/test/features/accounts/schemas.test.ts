import { describe, expect, test } from "vitest";

import {
  accountSchema,
  accountServerSchema,
} from "@/features/accounts/schemas";
import { buildAccountInput } from "@/test/data/build-account-input";
import { buildAccountServerInput } from "@/test/data/build-account-server-input";

describe("accounts schemas", () => {
  test("When the account input is valid, then it passes validation", () => {
    const input = buildAccountInput();

    const result = accountSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(input);
  });

  test("When the initial balance is negative, then validation fails", () => {
    const input = buildAccountInput({ initialBalance: -50 });
    const expectedMessage = "Initial balance cannot be negative";

    const result = accountSchema.safeParse(input);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(expectedMessage);
  });

  test("When server input uses a numeric string, then it coerces to a number", () => {
    const input = buildAccountServerInput({ initialBalance: "4200" });
    const expectedBalance = 4200;

    const result = accountServerSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data?.initialBalance).toBe(expectedBalance);
  });
});
