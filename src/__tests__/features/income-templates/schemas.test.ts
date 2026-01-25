// @vitest-environment node
import { describe, expect, test } from "vitest";

import {
  incomeTemplateSchema,
  incomeTemplateServerSchema,
} from "@/features/income-templates/schemas";
import { buildIncomeTemplateInput } from "@/__tests__/data/build-income-template-input";
import { buildIncomeTemplateServerInput } from "@/__tests__/data/build-income-template-server-input";

describe("income templates schemas", () => {
  test("When the income template input is valid, then it passes validation", () => {
    const input = buildIncomeTemplateInput();

    const result = incomeTemplateSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(input);
  });

  test("When the name is empty, then validation fails", () => {
    const input = buildIncomeTemplateInput({ name: "" });
    const expectedMessage = "Name is required";

    const result = incomeTemplateSchema.safeParse(input);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(expectedMessage);
  });

  test("When server input uses a numeric string, then it coerces to a number", () => {
    const input = buildIncomeTemplateServerInput({ amount: "4200" });
    const expectedAmount = 4200;

    const result = incomeTemplateServerSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data?.amount).toBe(expectedAmount);
  });
});
