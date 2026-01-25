// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccountWithBalance } from "@/__tests__/data/build-account-with-balance";
import { buildCategoryBreakdown } from "@/__tests__/data/build-category-breakdown";

const requireAuthMock = vi.hoisted(() => vi.fn());
const getReportSummaryMock = vi.hoisted(() => vi.fn());
const getMonthlyTrendsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/features/reports/queries", () => ({
  getReportSummary: getReportSummaryMock,
  getMonthlyTrends: getMonthlyTrendsMock,
}));

import { GET } from "@/app/api/reports/route";

describe("reports route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When requesting summary and trends, then it returns both payloads", async () => {
    const summary = {
      totalIncome: 400,
      totalExpenses: 200,
      netBalance: 200,
      accountBalances: [buildAccountWithBalance({ id: "account-101" })],
      incomeByCategory: [buildCategoryBreakdown({ categoryId: "category-101" })],
      expenseByCategory: [buildCategoryBreakdown({ categoryId: "category-201" })],
    };
    const trends = [{ month: "2024-02", income: 100, expenses: 50 }];
    const expected = JSON.parse(JSON.stringify({ summary, trends }));
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    getReportSummaryMock.mockResolvedValue(summary);
    getMonthlyTrendsMock.mockResolvedValue(trends);
    const request = new Request(
      "http://localhost/api/reports?from=2024-02-01&to=2024-02-29&months=2"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expected);
  });

  test("When requesting only trends, then it returns the trends payload", async () => {
    const trends = [{ month: "2024-02", income: 100, expenses: 50 }];
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    getMonthlyTrendsMock.mockResolvedValue(trends);
    const request = new Request("http://localhost/api/reports?months=3");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ trends });
  });

  test("When missing report parameters, then it returns a validation error", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    const request = new Request("http://localhost/api/reports");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Missing from/to or months parameters" });
  });
});
