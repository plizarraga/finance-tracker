// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildActionResult } from "@/__tests__/data/build-action-result";

const submitFormMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  submitForm: submitFormMock,
}));

import {
  createIncome,
  deleteIncome,
  updateIncome,
} from "@/features/incomes/api";

describe("incomes api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating an income, then it posts form data to the incomes endpoint", async () => {
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await createIncome(formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      "/api/incomes",
      "POST",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When updating an income, then it sends the form data to the income endpoint", async () => {
    const id = "income-203";
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await updateIncome(id, formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/incomes/${id}`,
      "PUT",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When deleting an income, then it calls the delete endpoint", async () => {
    const id = "income-203";
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await deleteIncome(id);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/incomes/${id}`,
      "DELETE"
    );
    expect(result).toEqual(expected);
  });
});
