// @vitest-environment node
import { describe, expect, test } from "vitest";

import {
  transferSchema,
  transferServerSchema,
} from "@/features/transfers/schemas";
import { buildTransferInput } from "@/__tests__/data/build-transfer-input";
import { buildTransferServerInput } from "@/__tests__/data/build-transfer-server-input";

describe("transfers schemas", () => {
  test("When the transfer input is valid, then it passes validation", () => {
    const input = buildTransferInput();

    const result = transferSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(input);
  });

  test("When the accounts are the same, then validation fails", () => {
    const input = buildTransferInput({
      toAccountId: "11111111-1111-4111-8111-111111111111",
    });
    const expectedMessage = "Source and destination must be different";

    const result = transferSchema.safeParse(input);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(expectedMessage);
  });

  test("When server input uses a numeric string, then it coerces to a number", () => {
    const input = buildTransferServerInput({ amount: "4200" });
    const expectedAmount = 4200;

    const result = transferServerSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data?.amount).toBe(expectedAmount);
  });
});
