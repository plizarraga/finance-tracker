// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildExpense } from "@/__tests__/data/build-expense";
import { buildExpenseFormData } from "@/__tests__/helpers/build-expense-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const getExpenseByIdMock = vi.hoisted(() => vi.fn());
const expenseFindFirstMock = vi.hoisted(() => vi.fn());
const expenseUpdateMock = vi.hoisted(() => vi.fn());
const expenseDeleteMock = vi.hoisted(() => vi.fn());
const accountFindFirstMock = vi.hoisted(() => vi.fn());
const categoryFindFirstMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/features/expenses/queries", () => ({
  getExpenseById: getExpenseByIdMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    expense: {
      findFirst: expenseFindFirstMock,
      update: expenseUpdateMock,
      delete: expenseDeleteMock,
    },
    account: { findFirst: accountFindFirstMock },
    category: { findFirst: categoryFindFirstMock },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { DELETE, GET, PUT } from "@/app/api/expenses/[id]/route";

describe("expenses id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When fetching an expense by id, then it returns the expense payload", async () => {
    const expense = buildExpense({ id: "expense-301" });
    const expected = JSON.parse(JSON.stringify(expense));
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    getExpenseByIdMock.mockResolvedValue(expense);
    const params = Promise.resolve({ id: expense.id });

    const response = await GET(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expected);
  });

  test("When updating a missing expense, then it returns not found", async () => {
    const formData = buildExpenseFormData();
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    expenseFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "expense-404" });
    const request = new Request("http://localhost", {
      method: "PUT",
      body: formData,
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Expense not found" });
  });

  test("When deleting a missing expense, then it returns not found", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    expenseFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "expense-404" });

    const response = await DELETE(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Expense not found" });
  });
});
