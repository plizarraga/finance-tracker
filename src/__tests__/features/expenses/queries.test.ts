// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildCategory } from "@/__tests__/data/build-category";
import { buildExpense } from "@/__tests__/data/build-expense";
import { normalizeDescription } from "@/lib/normalize";

const requireAuthMock = vi.hoisted(() => vi.fn());
const isUnauthorizedErrorMock = vi.hoisted(() => vi.fn());
const expenseFindManyMock = vi.hoisted(() => vi.fn());
const expenseFindFirstMock = vi.hoisted(() => vi.fn());
const expenseCountMock = vi.hoisted(() => vi.fn());
const expenseAggregateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: isUnauthorizedErrorMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    expense: {
      findMany: expenseFindManyMock,
      findFirst: expenseFindFirstMock,
      count: expenseCountMock,
      aggregate: expenseAggregateMock,
    },
  },
}));

import {
  getExpenseById,
  getExpenses,
  getExpensesCount,
  getExpensesTotal,
} from "@/features/expenses/queries";

describe("expenses queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isUnauthorizedErrorMock.mockReturnValue(false);
  });

  test("When getting expenses, then it applies filters and ordering", async () => {
    const userId = "user-203";
    const filters = {
      accountId: "account-102",
      categoryId: "category-102",
      description: "gro",
      amountMin: 10,
      amountMax: 200,
      page: 2,
      pageSize: 5,
      sortBy: "category" as const,
      sortOrder: "asc" as const,
      dateRange: {
        from: new Date("2024-02-01T00:00:00.000Z"),
        to: new Date("2024-02-10T00:00:00.000Z"),
      },
    };
    const account = buildAccount({ id: filters.accountId, userId });
    const category = buildCategory({ id: filters.categoryId, userId });
    const expenses = [
      { ...buildExpense({ userId }), account, category },
      { ...buildExpense({ id: "expense-103", userId }), account, category },
    ];
    requireAuthMock.mockResolvedValue({ userId });
    expenseFindManyMock.mockResolvedValue(expenses);
    const normalizedDescription = normalizeDescription(filters.description);

    const result = await getExpenses(filters);

    expect(expenseFindManyMock).toHaveBeenCalledWith({
      where: {
        userId,
        accountId: filters.accountId,
        categoryId: filters.categoryId,
        descriptionNormalized: {
          contains: normalizedDescription,
          mode: "insensitive",
        },
        date: { gte: filters.dateRange.from, lte: filters.dateRange.to },
        amount: { gte: filters.amountMin, lte: filters.amountMax },
      },
      include: { account: true, category: true },
      orderBy: { category: { name: filters.sortOrder } },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    });
    expect(result).toEqual(expenses);
  });

  test("When getting an expense by id, then it scopes by user id", async () => {
    const userId = "user-203";
    const expenseId = "expense-303";
    const account = buildAccount({ id: "account-103", userId });
    const category = buildCategory({ id: "category-103", userId });
    const expense = { ...buildExpense({ id: expenseId, userId }), account, category };
    requireAuthMock.mockResolvedValue({ userId });
    expenseFindFirstMock.mockResolvedValue(expense);

    const result = await getExpenseById(expenseId);

    expect(expenseFindFirstMock).toHaveBeenCalledWith({
      where: { id: expenseId, userId },
      include: { account: true, category: true },
    });
    expect(result).toEqual(expense);
  });

  test("When counting expenses, then it applies the filters", async () => {
    const userId = "user-203";
    const dateRange = {
      from: new Date("2024-02-01T00:00:00.000Z"),
      to: new Date("2024-02-10T00:00:00.000Z"),
    };
    const filters = {
      accountId: "account-102",
      categoryId: "category-102",
      description: "gro",
      amountMin: 10,
      amountMax: 200,
      dateRange,
    };
    const expectedCount = 12;
    requireAuthMock.mockResolvedValue({ userId });
    expenseCountMock.mockResolvedValue(expectedCount);
    const normalizedDescription = normalizeDescription(filters.description);

    const result = await getExpensesCount(filters);

    expect(expenseCountMock).toHaveBeenCalledWith({
      where: {
        userId,
        accountId: filters.accountId,
        categoryId: filters.categoryId,
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

  test("When getting expenses total with a date range, then it aggregates amounts", async () => {
    const userId = "user-203";
    const dateRange = {
      from: new Date("2024-02-01T00:00:00.000Z"),
      to: new Date("2024-02-10T00:00:00.000Z"),
    };
    requireAuthMock.mockResolvedValue({ userId });
    expenseAggregateMock.mockResolvedValue({
      _sum: { amount: { toNumber: () => 47670.12 } },
    });

    const result = await getExpensesTotal(dateRange);

    expect(expenseAggregateMock).toHaveBeenCalledWith({
      where: {
        userId,
        date: { gte: dateRange.from, lte: dateRange.to },
      },
      _sum: { amount: true },
    });
    expect(result).toBe(47670.12);
  });

  test("When getting expenses total without a date range, then it aggregates for the user", async () => {
    const userId = "user-203";
    requireAuthMock.mockResolvedValue({ userId });
    expenseAggregateMock.mockResolvedValue({
      _sum: { amount: { toNumber: () => 0 } },
    });

    const result = await getExpensesTotal();

    expect(expenseAggregateMock).toHaveBeenCalledWith({
      where: { userId },
      _sum: { amount: true },
    });
    expect(result).toBe(0);
  });
});
