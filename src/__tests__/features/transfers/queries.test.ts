// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildTransfer } from "@/__tests__/data/build-transfer";
import { normalizeDescription } from "@/lib/normalize";

const requireAuthMock = vi.hoisted(() => vi.fn());
const isUnauthorizedErrorMock = vi.hoisted(() => vi.fn());
const transferFindManyMock = vi.hoisted(() => vi.fn());
const transferFindFirstMock = vi.hoisted(() => vi.fn());
const transferCountMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: isUnauthorizedErrorMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    transfer: {
      findMany: transferFindManyMock,
      findFirst: transferFindFirstMock,
      count: transferCountMock,
    },
  },
}));

import {
  getTransferById,
  getTransfers,
  getTransfersCount,
} from "@/features/transfers/queries";

describe("transfers queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isUnauthorizedErrorMock.mockReturnValue(false);
  });

  test("When getting transfers, then it applies filters and ordering", async () => {
    const userId = "user-203";
    const filters = {
      accountId: "account-102",
      description: "save",
      amountMin: 50,
      amountMax: 500,
      page: 2,
      pageSize: 5,
      sortBy: "fromAccount" as const,
      sortOrder: "asc" as const,
      dateRange: {
        from: new Date("2024-02-01T00:00:00.000Z"),
        to: new Date("2024-02-10T00:00:00.000Z"),
      },
    };
    const fromAccount = buildAccount({ id: "account-102", userId });
    const toAccount = buildAccount({ id: "account-103", userId, name: "Savings" });
    const transfers = [
      { ...buildTransfer({ userId }), fromAccount, toAccount },
      { ...buildTransfer({ id: "transfer-103", userId }), fromAccount, toAccount },
    ];
    requireAuthMock.mockResolvedValue({ userId });
    transferFindManyMock.mockResolvedValue(transfers);
    const normalizedDescription = normalizeDescription(filters.description);

    const result = await getTransfers(filters);

    expect(transferFindManyMock).toHaveBeenCalledWith({
      where: {
        userId,
        OR: [
          { fromAccountId: filters.accountId },
          { toAccountId: filters.accountId },
        ],
        descriptionNormalized: {
          contains: normalizedDescription,
          mode: "insensitive",
        },
        date: { gte: filters.dateRange.from, lte: filters.dateRange.to },
        amount: { gte: filters.amountMin, lte: filters.amountMax },
      },
      include: { fromAccount: true, toAccount: true },
      orderBy: { fromAccount: { name: filters.sortOrder } },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    });
    expect(result).toEqual(transfers);
  });

  test("When getting a transfer by id, then it scopes by user id", async () => {
    const userId = "user-203";
    const transferId = "transfer-303";
    const fromAccount = buildAccount({ id: "account-105", userId });
    const toAccount = buildAccount({ id: "account-106", userId, name: "Emergency" });
    const transfer = { ...buildTransfer({ id: transferId, userId }), fromAccount, toAccount };
    requireAuthMock.mockResolvedValue({ userId });
    transferFindFirstMock.mockResolvedValue(transfer);

    const result = await getTransferById(transferId);

    expect(transferFindFirstMock).toHaveBeenCalledWith({
      where: { id: transferId, userId },
      include: { fromAccount: true, toAccount: true },
    });
    expect(result).toEqual(transfer);
  });

  test("When counting transfers, then it applies the filters", async () => {
    const userId = "user-203";
    const dateRange = {
      from: new Date("2024-02-01T00:00:00.000Z"),
      to: new Date("2024-02-10T00:00:00.000Z"),
    };
    const filters = {
      accountId: "account-102",
      description: "save",
      amountMin: 50,
      amountMax: 500,
      dateRange,
    };
    const expectedCount = 5;
    requireAuthMock.mockResolvedValue({ userId });
    transferCountMock.mockResolvedValue(expectedCount);
    const normalizedDescription = normalizeDescription(filters.description);

    const result = await getTransfersCount(filters);

    expect(transferCountMock).toHaveBeenCalledWith({
      where: {
        userId,
        OR: [
          { fromAccountId: filters.accountId },
          { toAccountId: filters.accountId },
        ],
        descriptionNormalized: {
          contains: normalizedDescription,
          mode: "insensitive",
        },
        date: { gte: dateRange.from, lte: dateRange.to },
        amount: { gte: filters.amountMin, lte: filters.amountMax },
      },
    });
    expect(result).toBe(expectedCount);
  });
});
