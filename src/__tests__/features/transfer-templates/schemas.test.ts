// @vitest-environment node
import { describe, expect, test } from "vitest";

import {
  transferTemplateSchema,
  transferTemplateServerSchema,
} from "@/features/transfer-templates/schemas";
import { buildTransferTemplateInput } from "@/__tests__/data/build-transfer-template-input";
import { buildTransferTemplateServerInput } from "@/__tests__/data/build-transfer-template-server-input";

describe("transfer templates schemas", () => {
  test("When the transfer template input is valid, then it passes validation", () => {
    const input = buildTransferTemplateInput();

    const result = transferTemplateSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(input);
  });

  test("When the name is empty, then validation fails", () => {
    const input = buildTransferTemplateInput({ name: "" });
    const expectedMessage = "Name is required";

    const result = transferTemplateSchema.safeParse(input);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(expectedMessage);
  });

  test("When server input uses a numeric string, then it coerces to a number", () => {
    const input = buildTransferTemplateServerInput({ amount: "4200" });
    const expectedAmount = 4200;

    const result = transferTemplateServerSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data?.amount).toBe(expectedAmount);
  });
});
