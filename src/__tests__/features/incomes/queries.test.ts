// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildCategory } from "@/__tests__/data/build-category";
import { buildIncome } from "@/__tests__/data/build-income";

const requireAuthMock = vi.hoisted(() => vi.fn());
const isUnauthorizedErrorMock = vi.hoisted(() => vi.fn());
const incomeFindManyMock = vi.hoisted(() => vi.fn());
const incomeFindFirstMock = vi.hoisted(() => vi.fn());
const incomeCountMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: isUnauthorizedErrorMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    income: {
      findMany: incomeFindManyMock,
      findFirst: incomeFindFirstMock,
      count: incomeCountMock,
    },
  },
}));

import {
  getIncomeById,
  getIncomes,
  getIncomesCount,
} from "@/features/incomes/queries";

describe("incomes queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isUnauthorizedErrorMock.mockReturnValue(false);
  });

  test("When getting incomes, then it applies filters and ordering", async () => {
    const userId = "user-203";
    const filters = {
      accountId: "account-102",
      categoryId: "category-102",
      description: "sal",
      amountMin: 500,
      amountMax: 2000,
      page: 2,
      pageSize: 5,
      sortBy: "account" as const,
      sortOrder: "desc" as const,
      dateRange: {
        from: new Date("2024-02-01T00:00:00.000Z"),
        to: new Date("2024-02-10T00:00:00.000Z"),
      },
    };
    const account = buildAccount({ id: filters.accountId, userId });
    const category = buildCategory({ id: filters.categoryId, userId, type: "income" });
    const incomes = [
      { ...buildIncome({ userId }), account, category },
      { ...buildIncome({ id: "income-103", userId }), account, category },
    ];
    requireAuthMock.mockResolvedValue({ userId });
    incomeFindManyMock.mockResolvedValue(incomes);

    const result = await getIncomes(filters);

    expect(incomeFindManyMock).toHaveBeenCalledWith({
      where: {
        userId,
        accountId: filters.accountId,
        categoryId: filters.categoryId,
        description: { contains: filters.description, mode: "insensitive" },
        date: { gte: filters.dateRange.from, lte: filters.dateRange.to },
        amount: { gte: filters.amountMin, lte: filters.amountMax },
      },
      include: { account: true, category: true },
      orderBy: { account: { name: filters.sortOrder } },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    });
    expect(result).toEqual(incomes);
  });

  test("When getting an income by id, then it scopes by user id", async () => {
    const userId = "user-203";
    const incomeId = "income-303";
    const account = buildAccount({ id: "account-103", userId });
    const category = buildCategory({ id: "category-103", userId, type: "income" });
    const income = { ...buildIncome({ id: incomeId, userId }), account, category };
    requireAuthMock.mockResolvedValue({ userId });
    incomeFindFirstMock.mockResolvedValue(income);

    const result = await getIncomeById(incomeId);

    expect(incomeFindFirstMock).toHaveBeenCalledWith({
      where: { id: incomeId, userId },
      include: { account: true, category: true },
    });
    expect(result).toEqual(income);
  });

  test("When counting incomes, then it applies the filters", async () => {
    const userId = "user-203";
    const dateRange = {
      from: new Date("2024-02-01T00:00:00.000Z"),
      to: new Date("2024-02-10T00:00:00.000Z"),
    };
    const filters = {
      accountId: "account-102",
      categoryId: "category-102",
      description: "sal",
      amountMin: 500,
      amountMax: 2000,
      dateRange,
    };
    const expectedCount = 7;
    requireAuthMock.mockResolvedValue({ userId });
    incomeCountMock.mockResolvedValue(expectedCount);

    const result = await getIncomesCount(filters);

    expect(incomeCountMock).toHaveBeenCalledWith({
      where: {
        userId,
        accountId: filters.accountId,
        categoryId: filters.categoryId,
        description: { contains: filters.description, mode: "insensitive" },
        date: { gte: dateRange.from, lte: dateRange.to },
        amount: { gte: filters.amountMin, lte: filters.amountMax },
      },
    });
    expect(result).toBe(expectedCount);
  });
});
