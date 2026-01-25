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
  createIncomeTemplate,
  deleteIncomeTemplate,
  duplicateIncomeTemplate,
  setDefaultIncomeTemplate,
  updateIncomeTemplate,
} from "@/features/income-templates/api";

describe("income templates api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating an income template, then it posts form data to the endpoint", async () => {
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await createIncomeTemplate(formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      "/api/income-templates",
      "POST",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When updating an income template, then it sends the form data to the endpoint", async () => {
    const id = "income-template-203";
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await updateIncomeTemplate(id, formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/income-templates/${id}`,
      "PUT",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When deleting an income template, then it calls the delete endpoint", async () => {
    const id = "income-template-203";
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await deleteIncomeTemplate(id);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/income-templates/${id}`,
      "DELETE"
    );
    expect(result).toEqual(expected);
  });

  test("When duplicating an income template, then it posts to the duplicate endpoint", async () => {
    const id = "income-template-204";
    const expected = buildActionResult({ success: true });
    submitJsonMock.mockResolvedValue(expected);

    const result = await duplicateIncomeTemplate(id);

    expect(submitJsonMock).toHaveBeenCalledWith(
      `/api/income-templates/${id}/duplicate`,
      "POST"
    );
    expect(result).toEqual(expected);
  });

  test("When setting a default income template, then it posts the selection", async () => {
    const id = "income-template-205";
    const expected = buildActionResult({ success: true });
    submitJsonMock.mockResolvedValue(expected);

    const result = await setDefaultIncomeTemplate(id);

    expect(submitJsonMock).toHaveBeenCalledWith(
      "/api/income-templates/default",
      "POST",
      { id }
    );
    expect(result).toEqual(expected);
  });
});
