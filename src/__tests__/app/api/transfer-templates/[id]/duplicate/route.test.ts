// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildTransferTemplate } from "@/__tests__/data/build-transfer-template";

const requireAuthMock = vi.hoisted(() => vi.fn());
const transferTemplateFindFirstMock = vi.hoisted(() => vi.fn());
const transferTemplateCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    transferTemplate: {
      findFirst: transferTemplateFindFirstMock,
      create: transferTemplateCreateMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST } from "@/app/api/transfer-templates/[id]/duplicate/route";

describe("transfer templates duplicate route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When duplicating a missing template, then it returns not found", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    transferTemplateFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "transfer-template-404" });

    const response = await POST(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Template not found" });
  });

  test("When duplicating a template, then it returns success", async () => {
    const template = buildTransferTemplate({ id: "transfer-template-301" });
    requireAuthMock.mockResolvedValue({ userId: template.userId });
    transferTemplateFindFirstMock.mockResolvedValue(template);
    const params = Promise.resolve({ id: template.id });

    const response = await POST(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});
