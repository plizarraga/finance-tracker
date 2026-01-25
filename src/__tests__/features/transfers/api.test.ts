// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildActionResult } from "@/__tests__/data/build-action-result";

const submitFormMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  submitForm: submitFormMock,
}));

import {
  createTransfer,
  deleteTransfer,
  updateTransfer,
} from "@/features/transfers/api";

describe("transfers api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating a transfer, then it posts form data to the transfers endpoint", async () => {
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await createTransfer(formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      "/api/transfers",
      "POST",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When updating a transfer, then it sends the form data to the transfer endpoint", async () => {
    const id = "transfer-203";
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await updateTransfer(id, formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/transfers/${id}`,
      "PUT",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When deleting a transfer, then it calls the delete endpoint", async () => {
    const id = "transfer-203";
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await deleteTransfer(id);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/transfers/${id}`,
      "DELETE"
    );
    expect(result).toEqual(expected);
  });
});
