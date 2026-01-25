// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildCategory } from "@/__tests__/data/build-category";
import { buildExpenseTemplateFormData } from "@/__tests__/helpers/build-expense-template-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const accountFindFirstMock = vi.hoisted(() => vi.fn());
const categoryFindFirstMock = vi.hoisted(() => vi.fn());
const expenseTemplateCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    account: { findFirst: accountFindFirstMock },
    category: { findFirst: categoryFindFirstMock },
    expenseTemplate: { create: expenseTemplateCreateMock },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST } from "@/app/api/expense-templates/route";

describe("expense templates route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating an expense template with invalid account, then it returns a validation error", async () => {
    const formData = buildExpenseTemplateFormData();
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    accountFindFirstMock.mockResolvedValue(null);
    const request = new Request("http://localhost/api/expense-templates", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ success: false, error: "Invalid account" });
  });

  test("When creating an expense template, then it returns success", async () => {
    const formData = buildExpenseTemplateFormData();
    const account = buildAccount({ id: "account-101" });
    requireAuthMock.mockResolvedValue({ userId: account.userId });
    accountFindFirstMock.mockResolvedValue(account);
    categoryFindFirstMock.mockResolvedValue(
      buildCategory({ id: "category-101", type: "expense" })
    );
    const request = new Request("http://localhost/api/expense-templates", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});
