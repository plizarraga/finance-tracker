// @vitest-environment node
import { describe, expect, test } from "vitest";

import {
  incomeSchema,
  incomeServerSchema,
} from "@/features/incomes/schemas";
import { buildIncomeInput } from "@/__tests__/data/build-income-input";
import { buildIncomeServerInput } from "@/__tests__/data/build-income-server-input";

describe("incomes schemas", () => {
  test("When the income input is valid, then it passes validation", () => {
    const input = buildIncomeInput();

    const result = incomeSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(input);
  });

  test("When the amount is negative, then validation fails", () => {
    const input = buildIncomeInput({ amount: -50 });
    const expectedMessage = "Amount must be positive";

    const result = incomeSchema.safeParse(input);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(expectedMessage);
  });

  test("When server input uses a numeric string, then it coerces to a number", () => {
    const input = buildIncomeServerInput({ amount: "4200" });
    const expectedAmount = 4200;

    const result = incomeServerSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data?.amount).toBe(expectedAmount);
  });
});
