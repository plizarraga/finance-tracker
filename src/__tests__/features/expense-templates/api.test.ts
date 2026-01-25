// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildActionResult } from "@/__tests__/data/build-action-result";

const submitFormMock = vi.hoisted(() => vi.fn());
const submitJsonMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  submitForm: submitFormMock,
  submitJson: submitJsonMock,
}));

import {
  createExpenseTemplate,
  deleteExpenseTemplate,
  duplicateExpenseTemplate,
  setDefaultExpenseTemplate,
  updateExpenseTemplate,
} from "@/features/expense-templates/api";

describe("expense templates api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating an expense template, then it posts form data to the endpoint", async () => {
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await createExpenseTemplate(formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      "/api/expense-templates",
      "POST",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When updating an expense template, then it sends the form data to the endpoint", async () => {
    const id = "expense-template-203";
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await updateExpenseTemplate(id, formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/expense-templates/${id}`,
      "PUT",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When deleting an expense template, then it calls the delete endpoint", async () => {
    const id = "expense-template-203";
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await deleteExpenseTemplate(id);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/expense-templates/${id}`,
      "DELETE"
    );
    expect(result).toEqual(expected);
  });

  test("When duplicating an expense template, then it posts to the duplicate endpoint", async () => {
    const id = "expense-template-204";
    const expected = buildActionResult({ success: true });
    submitJsonMock.mockResolvedValue(expected);

    const result = await duplicateExpenseTemplate(id);

    expect(submitJsonMock).toHaveBeenCalledWith(
      `/api/expense-templates/${id}/duplicate`,
      "POST"
    );
    expect(result).toEqual(expected);
  });

  test("When setting a default expense template, then it posts the selection", async () => {
    const id = "expense-template-205";
    const expected = buildActionResult({ success: true });
    submitJsonMock.mockResolvedValue(expected);

    const result = await setDefaultExpenseTemplate(id);

    expect(submitJsonMock).toHaveBeenCalledWith(
      "/api/expense-templates/default",
      "POST",
      { id }
    );
    expect(result).toEqual(expected);
  });
});
