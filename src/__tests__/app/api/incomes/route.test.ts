// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildCategory } from "@/__tests__/data/build-category";
import { buildIncomeFormData } from "@/__tests__/helpers/build-income-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const accountFindFirstMock = vi.hoisted(() => vi.fn());
const categoryFindFirstMock = vi.hoisted(() => vi.fn());
const incomeCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    account: { findFirst: accountFindFirstMock },
    category: { findFirst: categoryFindFirstMock },
    income: { create: incomeCreateMock },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST } from "@/app/api/incomes/route";

describe("incomes route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating an income with invalid category, then it returns a validation error", async () => {
    const formData = buildIncomeFormData();
    const account = buildAccount({ id: "account-101" });
    requireAuthMock.mockResolvedValue({ userId: account.userId });
    accountFindFirstMock.mockResolvedValue(account);
    categoryFindFirstMock.mockResolvedValue(null);
    const request = new Request("http://localhost/api/incomes", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: "Invalid category or category is not income type",
    });
  });

  test("When creating an income, then it returns success", async () => {
    const formData = buildIncomeFormData();
    const account = buildAccount({ id: "account-101" });
    requireAuthMock.mockResolvedValue({ userId: account.userId });
    accountFindFirstMock.mockResolvedValue(account);
    categoryFindFirstMock.mockResolvedValue(
      buildCategory({ id: "category-101", type: "income" })
    );
    const request = new Request("http://localhost/api/incomes", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});
