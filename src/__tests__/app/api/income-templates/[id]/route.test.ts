// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildIncomeTemplateFormData } from "@/__tests__/helpers/build-income-template-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const incomeTemplateFindFirstMock = vi.hoisted(() => vi.fn());
const incomeTemplateUpdateMock = vi.hoisted(() => vi.fn());
const incomeTemplateDeleteMock = vi.hoisted(() => vi.fn());
const accountFindFirstMock = vi.hoisted(() => vi.fn());
const categoryFindFirstMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    incomeTemplate: {
      findFirst: incomeTemplateFindFirstMock,
      update: incomeTemplateUpdateMock,
      delete: incomeTemplateDeleteMock,
    },
    account: { findFirst: accountFindFirstMock },
    category: { findFirst: categoryFindFirstMock },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { DELETE, PUT } from "@/app/api/income-templates/[id]/route";

describe("income templates id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When updating a missing template, then it returns not found", async () => {
    const formData = buildIncomeTemplateFormData();
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    incomeTemplateFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "income-template-404" });
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
    incomeTemplateFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "income-template-404" });

    const response = await DELETE(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Template not found" });
  });
});
