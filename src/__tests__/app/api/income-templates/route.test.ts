// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildCategory } from "@/__tests__/data/build-category";
import { buildIncomeTemplateFormData } from "@/__tests__/helpers/build-income-template-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const accountFindFirstMock = vi.hoisted(() => vi.fn());
const categoryFindFirstMock = vi.hoisted(() => vi.fn());
const incomeTemplateCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    account: { findFirst: accountFindFirstMock },
    category: { findFirst: categoryFindFirstMock },
    incomeTemplate: { create: incomeTemplateCreateMock },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST } from "@/app/api/income-templates/route";

describe("income templates route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating an income template with invalid account, then it returns a validation error", async () => {
    const formData = buildIncomeTemplateFormData();
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    accountFindFirstMock.mockResolvedValue(null);
    const request = new Request("http://localhost/api/income-templates", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ success: false, error: "Invalid account" });
  });

  test("When creating an income template, then it returns success", async () => {
    const formData = buildIncomeTemplateFormData();
    const account = buildAccount({ id: "account-101" });
    requireAuthMock.mockResolvedValue({ userId: account.userId });
    accountFindFirstMock.mockResolvedValue(account);
    categoryFindFirstMock.mockResolvedValue(
      buildCategory({ id: "category-101", type: "income" })
    );
    const request = new Request("http://localhost/api/income-templates", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});
