// @vitest-environment node
import { describe, expect, test } from "vitest";

import {
  categorySchema,
  type CategoryInput,
} from "@/features/categories/schemas";
import { buildCategoryInput } from "@/__tests__/data/build-category-input";

describe("categories schemas", () => {
  test("When the category input is valid, then it passes validation", () => {
    const input = buildCategoryInput();

    const result = categorySchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(input);
  });

  test("When the name is empty, then validation fails", () => {
    const input = buildCategoryInput({ name: "" });
    const expectedMessage = "Name is required";

    const result = categorySchema.safeParse(input);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(expectedMessage);
  });

  test("When the type is invalid, then validation fails", () => {
    const input = {
      ...buildCategoryInput(),
      type: "transfer" as unknown as CategoryInput["type"],
    };
    const expectedMessage = "Invalid type";

    const result = categorySchema.safeParse(input);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(expectedMessage);
  });
});
