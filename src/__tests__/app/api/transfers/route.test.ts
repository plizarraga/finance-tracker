// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildTransferFormData } from "@/__tests__/helpers/build-transfer-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const accountFindManyMock = vi.hoisted(() => vi.fn());
const transferCreateMock = vi.hoisted(() => vi.fn());
const calculateAccountBalanceMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    account: { findMany: accountFindManyMock },
    transfer: { create: transferCreateMock },
  },
}));

vi.mock("@/features/accounts/queries", () => ({
  calculateAccountBalance: calculateAccountBalanceMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST } from "@/app/api/transfers/route";

describe("transfers route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating a transfer with insufficient funds, then it returns a validation error", async () => {
    const accounts = [
      buildAccount({ id: "11111111-1111-4111-8111-111111111111" }),
      buildAccount({ id: "22222222-2222-4222-8222-222222222222", name: "Savings" }),
    ];
    const formData = buildTransferFormData({
      fromAccountId: accounts[0].id,
      toAccountId: accounts[1].id,
    });
    requireAuthMock.mockResolvedValue({ userId: accounts[0].userId });
    accountFindManyMock.mockResolvedValue(accounts);
    calculateAccountBalanceMock.mockResolvedValue(50);
    const request = new Request("http://localhost/api/transfers", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: "Insufficient funds. Available: $50.00, Required: $200.00",
    });
  });

  test("When creating a transfer, then it returns success", async () => {
    const accounts = [
      buildAccount({ id: "11111111-1111-4111-8111-111111111111" }),
      buildAccount({ id: "22222222-2222-4222-8222-222222222222", name: "Savings" }),
    ];
    const formData = buildTransferFormData({
      fromAccountId: accounts[0].id,
      toAccountId: accounts[1].id,
    });
    requireAuthMock.mockResolvedValue({ userId: accounts[0].userId });
    accountFindManyMock.mockResolvedValue(accounts);
    calculateAccountBalanceMock.mockResolvedValue(500);
    const request = new Request("http://localhost/api/transfers", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});
