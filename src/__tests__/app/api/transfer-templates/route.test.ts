// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildTransferTemplateFormData } from "@/__tests__/helpers/build-transfer-template-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const accountFindFirstMock = vi.hoisted(() => vi.fn());
const transferTemplateCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    account: { findFirst: accountFindFirstMock },
    transferTemplate: { create: transferTemplateCreateMock },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST } from "@/app/api/transfer-templates/route";

describe("transfer templates route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When creating a transfer template with invalid from account, then it returns a validation error", async () => {
    const formData = buildTransferTemplateFormData();
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    accountFindFirstMock.mockResolvedValue(null);
    const request = new Request("http://localhost/api/transfer-templates", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ success: false, error: "Invalid from account" });
  });

  test("When creating a transfer template, then it returns success", async () => {
    const formData = buildTransferTemplateFormData();
    const fromAccount = buildAccount({ id: "account-101" });
    const toAccount = buildAccount({ id: "account-102", name: "Savings" });
    requireAuthMock.mockResolvedValue({ userId: fromAccount.userId });
    accountFindFirstMock.mockResolvedValueOnce(fromAccount).mockResolvedValueOnce(toAccount);
    const request = new Request("http://localhost/api/transfer-templates", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});
