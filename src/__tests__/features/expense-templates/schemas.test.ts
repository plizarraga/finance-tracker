// @vitest-environment node
import { describe, expect, test } from "vitest";

import {
  expenseTemplateSchema,
  expenseTemplateServerSchema,
} from "@/features/expense-templates/schemas";
import { buildExpenseTemplateInput } from "@/__tests__/data/build-expense-template-input";
import { buildExpenseTemplateServerInput } from "@/__tests__/data/build-expense-template-server-input";

describe("expense templates schemas", () => {
  test("When the expense template input is valid, then it passes validation", () => {
    const input = buildExpenseTemplateInput();

    const result = expenseTemplateSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(input);
  });

  test("When the name is empty, then validation fails", () => {
    const input = buildExpenseTemplateInput({ name: "" });
    const expectedMessage = "Name is required";

    const result = expenseTemplateSchema.safeParse(input);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(expectedMessage);
  });

  test("When server input uses a numeric string, then it coerces to a number", () => {
    const input = buildExpenseTemplateServerInput({ amount: "4200" });
    const expectedAmount = 4200;

    const result = expenseTemplateServerSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data?.amount).toBe(expectedAmount);
  });
});
