// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/test/data/build-account";
import { buildAccountWithBalance } from "@/test/data/build-account-with-balance";
import { buildAccountFormData } from "@/test/helpers/build-account-form-data";
import { stubAccountDeleteCounts } from "@/test/helpers/stub-account-delete-counts";

const requireAuthMock = vi.hoisted(() => vi.fn());
const getAccountsWithBalancesMock = vi.hoisted(() => vi.fn());
const accountFindFirstMock = vi.hoisted(() => vi.fn());
const accountUpdateMock = vi.hoisted(() => vi.fn());
const accountDeleteMock = vi.hoisted(() => vi.fn());
const incomeCountMock = vi.hoisted(() => vi.fn());
const expenseCountMock = vi.hoisted(() => vi.fn());
const transferCountMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/features/accounts/queries", () => ({
  getAccountsWithBalances: getAccountsWithBalancesMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    account: {
      findFirst: accountFindFirstMock,
      update: accountUpdateMock,
      delete: accountDeleteMock,
    },
    income: { count: incomeCountMock },
    expense: { count: expenseCountMock },
    transfer: { count: transferCountMock },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { DELETE, GET, PUT } from "@/app/api/accounts/[id]/route";

describe("accounts id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When fetching an account by id, then it returns the account payload", async () => {
    const account = buildAccountWithBalance({ id: "account-301" });
    const expected = JSON.parse(JSON.stringify(account));
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    getAccountsWithBalancesMock.mockResolvedValue([account]);
    const params = Promise.resolve({ id: account.id });

    const response = await GET(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expected);
  });

  test("When updating a missing account, then it returns not found", async () => {
    const formData = buildAccountFormData();
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    accountFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "account-404" });
    const request = new Request("http://localhost", {
      method: "PUT",
      body: formData,
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Account not found" });
  });

  test("When deleting an account with transactions, then it returns a validation error", async () => {
    const userId = "user-203";
    const account = buildAccount({ id: "account-402", userId });
    requireAuthMock.mockResolvedValue({ userId });
    accountFindFirstMock.mockResolvedValue(account);
    stubAccountDeleteCounts(incomeCountMock, expenseCountMock, transferCountMock, {
      incomes: 1,
      expenses: 0,
      transfersFrom: 0,
      transfersTo: 0,
    });
    const params = Promise.resolve({ id: account.id });

    const response = await DELETE(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error:
        "Cannot delete account with existing transactions. Please delete all transactions first.",
    });
  });
});
