// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildTransfer } from "@/__tests__/data/build-transfer";
import { buildTransferFormData } from "@/__tests__/helpers/build-transfer-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const getTransferByIdMock = vi.hoisted(() => vi.fn());
const transferFindFirstMock = vi.hoisted(() => vi.fn());
const transferUpdateMock = vi.hoisted(() => vi.fn());
const transferDeleteMock = vi.hoisted(() => vi.fn());
const accountFindManyMock = vi.hoisted(() => vi.fn());
const calculateAccountBalanceMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/features/transfers/queries", () => ({
  getTransferById: getTransferByIdMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    transfer: {
      findFirst: transferFindFirstMock,
      update: transferUpdateMock,
      delete: transferDeleteMock,
    },
    account: { findMany: accountFindManyMock },
  },
}));

vi.mock("@/features/accounts/queries", () => ({
  calculateAccountBalance: calculateAccountBalanceMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { DELETE, GET, PUT } from "@/app/api/transfers/[id]/route";

describe("transfers id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When fetching a transfer by id, then it returns the transfer payload", async () => {
    const transfer = buildTransfer({ id: "transfer-301" });
    const expected = JSON.parse(JSON.stringify(transfer));
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    getTransferByIdMock.mockResolvedValue(transfer);
    const params = Promise.resolve({ id: transfer.id });

    const response = await GET(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expected);
  });

  test("When updating a missing transfer, then it returns not found", async () => {
    const formData = buildTransferFormData();
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    transferFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "transfer-404" });
    const request = new Request("http://localhost", {
      method: "PUT",
      body: formData,
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Transfer not found" });
  });

  test("When deleting a missing transfer, then it returns not found", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    transferFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "transfer-404" });

    const response = await DELETE(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Transfer not found" });
  });
});
