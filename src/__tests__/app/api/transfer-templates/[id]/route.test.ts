// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildTransferTemplateFormData } from "@/__tests__/helpers/build-transfer-template-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const transferTemplateFindFirstMock = vi.hoisted(() => vi.fn());
const transferTemplateUpdateMock = vi.hoisted(() => vi.fn());
const transferTemplateDeleteMock = vi.hoisted(() => vi.fn());
const accountFindFirstMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    transferTemplate: {
      findFirst: transferTemplateFindFirstMock,
      update: transferTemplateUpdateMock,
      delete: transferTemplateDeleteMock,
    },
    account: { findFirst: accountFindFirstMock },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { DELETE, PUT } from "@/app/api/transfer-templates/[id]/route";

describe("transfer templates id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When updating a missing template, then it returns not found", async () => {
    const formData = buildTransferTemplateFormData();
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    transferTemplateFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "transfer-template-404" });
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
    transferTemplateFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "transfer-template-404" });

    const response = await DELETE(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Template not found" });
  });
});
