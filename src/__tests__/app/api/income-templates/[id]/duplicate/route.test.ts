// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildIncomeTemplate } from "@/__tests__/data/build-income-template";

const requireAuthMock = vi.hoisted(() => vi.fn());
const incomeTemplateFindFirstMock = vi.hoisted(() => vi.fn());
const incomeTemplateCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    incomeTemplate: {
      findFirst: incomeTemplateFindFirstMock,
      create: incomeTemplateCreateMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST } from "@/app/api/income-templates/[id]/duplicate/route";

describe("income templates duplicate route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When duplicating a missing template, then it returns not found", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    incomeTemplateFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "income-template-404" });

    const response = await POST(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Template not found" });
  });

  test("When duplicating a template, then it returns success", async () => {
    const template = buildIncomeTemplate({ id: "income-template-301" });
    requireAuthMock.mockResolvedValue({ userId: template.userId });
    incomeTemplateFindFirstMock.mockResolvedValue(template);
    const params = Promise.resolve({ id: template.id });

    const response = await POST(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});
