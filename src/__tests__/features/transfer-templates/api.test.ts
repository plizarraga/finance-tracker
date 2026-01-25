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
  createTransferTemplate,
  deleteTransferTemplate,
  duplicateTransferTemplate,
  setDefaultTransferTemplate,
  updateTransferTemplate,
} from "@/features/transfer-templates/api";

describe("transfer templates api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating a transfer template, then it posts form data to the endpoint", async () => {
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await createTransferTemplate(formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      "/api/transfer-templates",
      "POST",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When updating a transfer template, then it sends the form data to the endpoint", async () => {
    const id = "transfer-template-203";
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await updateTransferTemplate(id, formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/transfer-templates/${id}`,
      "PUT",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When deleting a transfer template, then it calls the delete endpoint", async () => {
    const id = "transfer-template-203";
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await deleteTransferTemplate(id);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/transfer-templates/${id}`,
      "DELETE"
    );
    expect(result).toEqual(expected);
  });

  test("When duplicating a transfer template, then it posts to the duplicate endpoint", async () => {
    const id = "transfer-template-204";
    const expected = buildActionResult({ success: true });
    submitJsonMock.mockResolvedValue(expected);

    const result = await duplicateTransferTemplate(id);

    expect(submitJsonMock).toHaveBeenCalledWith(
      `/api/transfer-templates/${id}/duplicate`,
      "POST"
    );
    expect(result).toEqual(expected);
  });

  test("When setting a default transfer template, then it posts the selection", async () => {
    const id = "transfer-template-205";
    const expected = buildActionResult({ success: true });
    submitJsonMock.mockResolvedValue(expected);

    const result = await setDefaultTransferTemplate(id);

    expect(submitJsonMock).toHaveBeenCalledWith(
      "/api/transfer-templates/default",
      "POST",
      { id }
    );
    expect(result).toEqual(expected);
  });
});
