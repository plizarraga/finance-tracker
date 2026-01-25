// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildAccountFormData } from "@/__tests__/helpers/build-account-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const getAccountsMock = vi.hoisted(() => vi.fn());
const accountCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/features/accounts/queries", () => ({
  getAccounts: getAccountsMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: { account: { create: accountCreateMock } },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { GET, POST } from "@/app/api/accounts/route";

describe("accounts route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When listing accounts, then it returns the accounts payload", async () => {
    const accounts = [
      buildAccount({ id: "account-101" }),
      buildAccount({ id: "account-102", name: "Savings" }),
    ];
    const expected = JSON.parse(JSON.stringify(accounts));
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    getAccountsMock.mockResolvedValue(accounts);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expected);
  });

  test("When creating an account with invalid data, then it returns validation errors", async () => {
    const formData = buildAccountFormData({ name: "" });
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    const request = new Request("http://localhost/api/accounts", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ success: false, error: "Name is required" });
  });

  test("When creating an account, then it returns the created account summary", async () => {
    const formData = buildAccountFormData();
    const account = buildAccount({ id: "account-201", name: "Checking" });
    requireAuthMock.mockResolvedValue({ userId: account.userId });
    accountCreateMock.mockResolvedValue(account);
    const request = new Request("http://localhost/api/accounts", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      data: { id: account.id, name: account.name },
    });
  });
});
