// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildActionResult } from "@/__tests__/data/build-action-result";
import { buildCategorySummary } from "@/__tests__/data/build-category-summary";

const submitFormMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  submitForm: submitFormMock,
}));

import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/features/categories/api";

describe("categories api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating a category, then it posts form data to the categories endpoint", async () => {
    const formData = new FormData();
    const category = buildCategorySummary();
    const expected = buildActionResult({ success: true, data: category });
    submitFormMock.mockResolvedValue(expected);

    const result = await createCategory(formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      "/api/categories",
      "POST",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When updating a category, then it sends the form data to the category endpoint", async () => {
    const id = "category-203";
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await updateCategory(id, formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/categories/${id}`,
      "PUT",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When deleting a category, then it calls the delete endpoint", async () => {
    const id = "category-203";
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await deleteCategory(id);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/categories/${id}`,
      "DELETE"
    );
    expect(result).toEqual(expected);
  });
});
