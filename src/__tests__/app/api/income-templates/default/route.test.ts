// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

const requireAuthMock = vi.hoisted(() => vi.fn());
const incomeTemplateFindFirstMock = vi.hoisted(() => vi.fn());
const incomeTemplateUpdateManyMock = vi.hoisted(() => vi.fn());
const incomeTemplateUpdateMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    incomeTemplate: {
      findFirst: incomeTemplateFindFirstMock,
      updateMany: incomeTemplateUpdateManyMock,
      update: incomeTemplateUpdateMock,
    },
    $transaction: transactionMock,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST } from "@/app/api/income-templates/default/route";

describe("income templates default route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When default payload has invalid id type, then it returns validation error", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ id: 123 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ success: false, error: "Invalid template id" });
  });

  test("When clearing the default template, then it returns success", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    incomeTemplateUpdateManyMock.mockResolvedValue({ count: 1 });
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ id: null }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});
