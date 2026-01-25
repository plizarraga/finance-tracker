// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildActionResult } from "@/__tests__/data/build-action-result";

const submitFormMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  submitForm: submitFormMock,
}));

import {
  createExpense,
  deleteExpense,
  updateExpense,
} from "@/features/expenses/api";

describe("expenses api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating an expense, then it posts form data to the expenses endpoint", async () => {
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await createExpense(formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      "/api/expenses",
      "POST",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When updating an expense, then it sends the form data to the expense endpoint", async () => {
    const id = "expense-203";
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await updateExpense(id, formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/expenses/${id}`,
      "PUT",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When deleting an expense, then it calls the delete endpoint", async () => {
    const id = "expense-203";
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await deleteExpense(id);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/expenses/${id}`,
      "DELETE"
    );
    expect(result).toEqual(expected);
  });
});
