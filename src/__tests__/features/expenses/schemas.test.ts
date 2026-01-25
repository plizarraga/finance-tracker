// @vitest-environment node
import { describe, expect, test } from "vitest";

import {
  expenseSchema,
  expenseServerSchema,
} from "@/features/expenses/schemas";
import { buildExpenseInput } from "@/__tests__/data/build-expense-input";
import { buildExpenseServerInput } from "@/__tests__/data/build-expense-server-input";

describe("expenses schemas", () => {
  test("When the expense input is valid, then it passes validation", () => {
    const input = buildExpenseInput();

    const result = expenseSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(input);
  });

  test("When the description is too short, then validation fails", () => {
    const input = buildExpenseInput({ description: "Go" });
    const expectedMessage = "Description must be at least 3 characters";

    const result = expenseSchema.safeParse(input);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(expectedMessage);
  });

  test("When server input uses a numeric string, then it coerces to a number", () => {
    const input = buildExpenseServerInput({ amount: "4200" });
    const expectedAmount = 4200;

    const result = expenseServerSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data?.amount).toBe(expectedAmount);
  });
});
