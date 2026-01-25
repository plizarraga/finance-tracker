// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

const requireAuthMock = vi.hoisted(() => vi.fn());
const expenseTemplateFindFirstMock = vi.hoisted(() => vi.fn());
const expenseTemplateUpdateManyMock = vi.hoisted(() => vi.fn());
const expenseTemplateUpdateMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    expenseTemplate: {
      findFirst: expenseTemplateFindFirstMock,
      updateMany: expenseTemplateUpdateManyMock,
      update: expenseTemplateUpdateMock,
    },
    $transaction: transactionMock,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST } from "@/app/api/expense-templates/default/route";

describe("expense templates default route", () => {
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
    expenseTemplateUpdateManyMock.mockResolvedValue({ count: 1 });
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
