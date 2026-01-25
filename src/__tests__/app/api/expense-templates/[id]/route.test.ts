// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildExpenseTemplateFormData } from "@/__tests__/helpers/build-expense-template-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const expenseTemplateFindFirstMock = vi.hoisted(() => vi.fn());
const expenseTemplateUpdateMock = vi.hoisted(() => vi.fn());
const expenseTemplateDeleteMock = vi.hoisted(() => vi.fn());
const accountFindFirstMock = vi.hoisted(() => vi.fn());
const categoryFindFirstMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    expenseTemplate: {
      findFirst: expenseTemplateFindFirstMock,
      update: expenseTemplateUpdateMock,
      delete: expenseTemplateDeleteMock,
    },
    account: { findFirst: accountFindFirstMock },
    category: { findFirst: categoryFindFirstMock },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { DELETE, PUT } from "@/app/api/expense-templates/[id]/route";

describe("expense templates id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When updating a missing template, then it returns not found", async () => {
    const formData = buildExpenseTemplateFormData();
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    expenseTemplateFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "expense-template-404" });
    const request = new Request("http://localhost", {
      method: "PUT",
      body: formData,
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Template not found" });
  });

  test("When deleting a missing template, then it returns not found", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    expenseTemplateFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "expense-template-404" });

    const response = await DELETE(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Template not found" });
  });
});
