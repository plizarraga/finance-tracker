// @vitest-environment node
import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildAccountsWithBalancesScenario } from "@/__tests__/helpers/build-accounts-with-balances-scenario";

const requireAuthMock = vi.hoisted(() => vi.fn());
const isUnauthorizedErrorMock = vi.hoisted(() => vi.fn());
const accountFindManyMock = vi.hoisted(() => vi.fn());
const accountFindFirstMock = vi.hoisted(() => vi.fn());
const accountFindUniqueMock = vi.hoisted(() => vi.fn());
const incomeAggregateMock = vi.hoisted(() => vi.fn());
const expenseAggregateMock = vi.hoisted(() => vi.fn());
const transferAggregateMock = vi.hoisted(() => vi.fn());
const incomeGroupByMock = vi.hoisted(() => vi.fn());
const expenseGroupByMock = vi.hoisted(() => vi.fn());
const transferGroupByMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: isUnauthorizedErrorMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    account: {
      findMany: accountFindManyMock,
      findFirst: accountFindFirstMock,
      findUnique: accountFindUniqueMock,
    },
    income: {
      aggregate: incomeAggregateMock,
      groupBy: incomeGroupByMock,
    },
    expense: {
      aggregate: expenseAggregateMock,
      groupBy: expenseGroupByMock,
    },
    transfer: {
      aggregate: transferAggregateMock,
      groupBy: transferGroupByMock,
    },
  },
}));

import {
  calculateAccountBalance,
  getAccountById,
  getAccounts,
  getAccountsWithBalances,
} from "@/features/accounts/queries";

describe("accounts queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isUnauthorizedErrorMock.mockReturnValue(false);
  });

  test("When getting accounts, then it returns the user accounts ordered by name", async () => {
    const userId = "user-203";
    const accounts = [
      buildAccount({ id: "account-101", userId }),
      buildAccount({ id: "account-102", userId, name: "Savings" }),
    ];
    requireAuthMock.mockResolvedValue({ userId });
    accountFindManyMock.mockResolvedValue(accounts);

    const result = await getAccounts();

    expect(accountFindManyMock).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { name: "asc" },
    });
    expect(result).toEqual(accounts);
  });

  test("When getting an account by id, then it scopes by user id", async () => {
    const userId = "user-203";
    const accountId = "account-103";
    const account = buildAccount({ id: accountId, userId });
    requireAuthMock.mockResolvedValue({ userId });
    accountFindFirstMock.mockResolvedValue(account);

    const result = await getAccountById(accountId);

    expect(accountFindFirstMock).toHaveBeenCalledWith({
      where: { id: accountId, userId },
    });
    expect(result).toEqual(account);
  });

  test("When calculating account balance, then it combines the aggregated totals", async () => {
    const amounts = {
      accountId: "account-104",
      initialBalance: new Prisma.Decimal(100),
      income: new Prisma.Decimal(50),
      expense: new Prisma.Decimal(20),
      transfersIn: new Prisma.Decimal(10),
      transfersOut: new Prisma.Decimal(5),
      expected: 135,
    };
    accountFindUniqueMock.mockResolvedValue({
      initialBalance: amounts.initialBalance,
    });
    incomeAggregateMock.mockResolvedValue({
      _sum: { amount: amounts.income },
    });
    expenseAggregateMock.mockResolvedValue({
      _sum: { amount: amounts.expense },
    });
    transferAggregateMock
      .mockResolvedValueOnce({ _sum: { amount: amounts.transfersIn } })
      .mockResolvedValueOnce({ _sum: { amount: amounts.transfersOut } });

    const result = await calculateAccountBalance(amounts.accountId);

    expect(accountFindUniqueMock).toHaveBeenCalledWith({
      where: { id: amounts.accountId },
      select: { initialBalance: true },
    });
    expect(result).toBe(amounts.expected);
  });

  test("When getting accounts with balances, then it returns computed balances", async () => {
    const scenario = buildAccountsWithBalancesScenario();
    requireAuthMock.mockResolvedValue({ userId: scenario.userId });
    accountFindManyMock.mockResolvedValue(scenario.accounts);
    incomeGroupByMock.mockResolvedValue(scenario.incomeSums);
    expenseGroupByMock.mockResolvedValue(scenario.expenseSums);
    transferGroupByMock
      .mockResolvedValueOnce(scenario.transfersInSums)
      .mockResolvedValueOnce(scenario.transfersOutSums);

    const result = await getAccountsWithBalances();

    expect(result).toEqual(scenario.expected);
  });
});
