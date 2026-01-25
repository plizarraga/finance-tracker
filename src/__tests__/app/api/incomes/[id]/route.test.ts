// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildIncome } from "@/__tests__/data/build-income";
import { buildIncomeFormData } from "@/__tests__/helpers/build-income-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const getIncomeByIdMock = vi.hoisted(() => vi.fn());
const incomeFindFirstMock = vi.hoisted(() => vi.fn());
const incomeUpdateMock = vi.hoisted(() => vi.fn());
const incomeDeleteMock = vi.hoisted(() => vi.fn());
const accountFindFirstMock = vi.hoisted(() => vi.fn());
const categoryFindFirstMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/features/incomes/queries", () => ({
  getIncomeById: getIncomeByIdMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    income: {
      findFirst: incomeFindFirstMock,
      update: incomeUpdateMock,
      delete: incomeDeleteMock,
    },
    account: { findFirst: accountFindFirstMock },
    category: { findFirst: categoryFindFirstMock },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { DELETE, GET, PUT } from "@/app/api/incomes/[id]/route";

describe("incomes id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When fetching an income by id, then it returns the income payload", async () => {
    const income = buildIncome({ id: "income-301" });
    const expected = JSON.parse(JSON.stringify(income));
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    getIncomeByIdMock.mockResolvedValue(income);
    const params = Promise.resolve({ id: income.id });

    const response = await GET(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expected);
  });

  test("When updating a missing income, then it returns not found", async () => {
    const formData = buildIncomeFormData();
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    incomeFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "income-404" });
    const request = new Request("http://localhost", {
      method: "PUT",
      body: formData,
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Income not found" });
  });

  test("When deleting a missing income, then it returns not found", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    incomeFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "income-404" });

    const response = await DELETE(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Income not found" });
  });
});
