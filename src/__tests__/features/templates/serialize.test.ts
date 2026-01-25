// @vitest-environment node
import { describe, expect, test } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { serializeAccount } from "@/features/templates/serialize";


describe("templates serialize", () => {
  test("When serializing an account, then it converts the initial balance", () => {
    const account = buildAccount();

    const result = serializeAccount(account);

    expect(result).toEqual({
      ...account,
      initialBalance: account.initialBalance.toNumber(),
    });
  });

  test("When serializing a null account, then it returns null", () => {
    const account = null;

    const result = serializeAccount(account);

    expect(result).toBeNull();
  });
});
