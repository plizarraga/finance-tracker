// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildExpenseTemplate } from "@/__tests__/data/build-expense-template";

const requireAuthMock = vi.hoisted(() => vi.fn());
const expenseTemplateFindFirstMock = vi.hoisted(() => vi.fn());
const expenseTemplateCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    expenseTemplate: {
      findFirst: expenseTemplateFindFirstMock,
      create: expenseTemplateCreateMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST } from "@/app/api/expense-templates/[id]/duplicate/route";

describe("expense templates duplicate route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When duplicating a missing template, then it returns not found", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    expenseTemplateFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "expense-template-404" });

    const response = await POST(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Template not found" });
  });

  test("When duplicating a template, then it returns success", async () => {
    const template = buildExpenseTemplate({ id: "expense-template-301" });
    requireAuthMock.mockResolvedValue({ userId: template.userId });
    expenseTemplateFindFirstMock.mockResolvedValue(template);
    const params = Promise.resolve({ id: template.id });

    const response = await POST(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});
