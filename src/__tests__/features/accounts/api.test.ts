// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildActionResult } from "@/__tests__/data/build-action-result";
import { buildAccountSummary } from "@/__tests__/data/build-account-summary";

const submitFormMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  submitForm: submitFormMock,
}));

import {
  createAccount,
  deleteAccount,
  updateAccount,
} from "@/features/accounts/api";

describe("accounts api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating an account, then it posts form data to the accounts endpoint", async () => {
    const formData = new FormData();
    const account = buildAccountSummary();
    const expected = buildActionResult({ success: true, data: account });
    submitFormMock.mockResolvedValue(expected);

    const result = await createAccount(formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      "/api/accounts",
      "POST",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When updating an account, then it sends the form data to the account endpoint", async () => {
    const id = "account-203";
    const formData = new FormData();
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await updateAccount(id, formData);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/accounts/${id}`,
      "PUT",
      formData
    );
    expect(result).toEqual(expected);
  });

  test("When deleting an account, then it calls the delete endpoint", async () => {
    const id = "account-203";
    const expected = buildActionResult({ success: true });
    submitFormMock.mockResolvedValue(expected);

    const result = await deleteAccount(id);

    expect(submitFormMock).toHaveBeenCalledWith(
      `/api/accounts/${id}`,
      "DELETE"
    );
    expect(result).toEqual(expected);
  });
});
