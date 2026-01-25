// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  buildExpenseByCategoryScenario,
  buildIncomeByCategoryScenario,
  buildMonthlyTrendsScenario,
  buildReportSummaryScenario,
} from "@/__tests__/helpers/build-report-scenarios";

const requireAuthMock = vi.hoisted(() => vi.fn());
const isUnauthorizedErrorMock = vi.hoisted(() => vi.fn());
const incomeGroupByMock = vi.hoisted(() => vi.fn());
const expenseGroupByMock = vi.hoisted(() => vi.fn());
const categoryFindManyMock = vi.hoisted(() => vi.fn());
const queryRawMock = vi.hoisted(() => vi.fn());
const getAccountsWithBalancesMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: isUnauthorizedErrorMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    income: { groupBy: incomeGroupByMock },
    expense: { groupBy: expenseGroupByMock },
    category: { findMany: categoryFindManyMock },
    $queryRaw: queryRawMock,
  },
}));

vi.mock("@/features/accounts/queries", () => ({
  getAccountsWithBalances: getAccountsWithBalancesMock,
}));

import {
  getExpenseByCategory,
  getIncomeByCategory,
  getMonthlyTrends,
  getReportSummary,
} from "@/features/reports/queries";

describe("reports queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isUnauthorizedErrorMock.mockReturnValue(false);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-03-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("When getting a report summary, then it combines totals and breakdowns", async () => {
    const scenario = buildReportSummaryScenario();
    requireAuthMock.mockResolvedValue({ userId: scenario.userId });
    getAccountsWithBalancesMock.mockResolvedValue(scenario.accountBalances);
    incomeGroupByMock.mockResolvedValue(scenario.incomeGrouped);
    expenseGroupByMock.mockResolvedValue(scenario.expenseGrouped);
    categoryFindManyMock.mockResolvedValue(scenario.categories);

    const result = await getReportSummary(scenario.dateRange);

    expect(result).toEqual(scenario.expected);
  });

  test("When getting income by category, then it returns a percentage breakdown", async () => {
    const scenario = buildIncomeByCategoryScenario();
    requireAuthMock.mockResolvedValue({ userId: scenario.userId });
    incomeGroupByMock.mockResolvedValue(scenario.grouped);
    categoryFindManyMock.mockResolvedValue(scenario.categories);

    const result = await getIncomeByCategory(scenario.dateRange);

    expect(incomeGroupByMock).toHaveBeenCalledWith({
      by: ["categoryId"],
      where: {
        userId: scenario.userId,
        date: { gte: scenario.dateRange.from, lte: scenario.dateRange.to },
      },
      _sum: { amount: true },
    });
    expect(result).toEqual(scenario.expected);
  });

  test("When getting expense by category, then it returns a percentage breakdown", async () => {
    const scenario = buildExpenseByCategoryScenario();
    requireAuthMock.mockResolvedValue({ userId: scenario.userId });
    expenseGroupByMock.mockResolvedValue(scenario.grouped);
    categoryFindManyMock.mockResolvedValue(scenario.categories);

    const result = await getExpenseByCategory(scenario.dateRange);

    expect(expenseGroupByMock).toHaveBeenCalledWith({
      by: ["categoryId"],
      where: {
        userId: scenario.userId,
        date: { gte: scenario.dateRange.from, lte: scenario.dateRange.to },
      },
      _sum: { amount: true },
    });
    expect(result).toEqual(scenario.expected);
  });

  test("When getting monthly trends, then it returns totals per month", async () => {
    const scenario = buildMonthlyTrendsScenario();
    requireAuthMock.mockResolvedValue({ userId: scenario.userId });
    queryRawMock
      .mockResolvedValueOnce(scenario.incomeRows)
      .mockResolvedValueOnce(scenario.expenseRows);

    const result = await getMonthlyTrends(scenario.months);

    expect(result).toEqual(scenario.expected);
  });
});
