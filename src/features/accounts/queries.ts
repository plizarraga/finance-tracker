import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import type { Account } from "@prisma/client";
import type { AccountWithBalance } from "@/types";

export async function getAccounts(): Promise<Account[]> {
  try {
    const { userId } = await requireAuth();
    return await prisma.account.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching accounts:", error);
    return [];
  }
}

export async function getAccountById(
  id: string
): Promise<Account | null> {
  try {
    const { userId } = await requireAuth();
    return await prisma.account.findFirst({
      where: { id, userId },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching account:", error);
    return null;
  }
}

/**
 * Calculate balance for a single account using parallel aggregations
 * OPTIMIZED: 4 aggregations in parallel instead of 4 sequential queries per account
 */
export async function calculateAccountBalance(accountId: string): Promise<number> {
  try {
    const [account, incomeSum, expenseSum, transfersInSum, transfersOutSum] =
      await Promise.all([
        prisma.account.findUnique({
          where: { id: accountId },
          select: { initialBalance: true },
        }),
        prisma.income.aggregate({
          where: { accountId },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { accountId },
          _sum: { amount: true },
        }),
        prisma.transfer.aggregate({
          where: { toAccountId: accountId },
          _sum: { amount: true },
        }),
        prisma.transfer.aggregate({
          where: { fromAccountId: accountId },
          _sum: { amount: true },
        }),
      ]);

    const initialBalance = account?.initialBalance?.toNumber() ?? 0;

    return (
      initialBalance +
      (incomeSum._sum.amount?.toNumber() ?? 0) +
      (transfersInSum._sum.amount?.toNumber() ?? 0) -
      (expenseSum._sum.amount?.toNumber() ?? 0) -
      (transfersOutSum._sum.amount?.toNumber() ?? 0)
    );
  } catch (error) {
    console.error("Error calculating account balance:", error);
    return 0;
  }
}

/**
 * Get all accounts with their calculated balances
 * OPTIMIZED: Uses parallel aggregations for each account
 */
export async function getAccountsWithBalances(
): Promise<AccountWithBalance[]> {
  try {
    const { userId } = await requireAuth();
    const [
      accounts,
      incomeSums,
      expenseSums,
      transfersInSums,
      transfersOutSums,
    ] = await Promise.all([
      prisma.account.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.income.groupBy({
        by: ["accountId"],
        where: { userId },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ["accountId"],
        where: { userId },
        _sum: { amount: true },
      }),
      prisma.transfer.groupBy({
        by: ["toAccountId"],
        where: { userId },
        _sum: { amount: true },
      }),
      prisma.transfer.groupBy({
        by: ["fromAccountId"],
        where: { userId },
        _sum: { amount: true },
      }),
    ]);

    const incomeByAccount = new Map(
      incomeSums.map((row) => [
        row.accountId,
        row._sum.amount?.toNumber() ?? 0,
      ])
    );
    const expenseByAccount = new Map(
      expenseSums.map((row) => [
        row.accountId,
        row._sum.amount?.toNumber() ?? 0,
      ])
    );
    const transfersInByAccount = new Map(
      transfersInSums.map((row) => [
        row.toAccountId,
        row._sum.amount?.toNumber() ?? 0,
      ])
    );
    const transfersOutByAccount = new Map(
      transfersOutSums.map((row) => [
        row.fromAccountId,
        row._sum.amount?.toNumber() ?? 0,
      ])
    );

    return accounts.map((account) => {
      const initialBalance = account.initialBalance?.toNumber?.() ?? 0;
      const incomeTotal = incomeByAccount.get(account.id) ?? 0;
      const expenseTotal = expenseByAccount.get(account.id) ?? 0;
      const transfersInTotal = transfersInByAccount.get(account.id) ?? 0;
      const transfersOutTotal = transfersOutByAccount.get(account.id) ?? 0;

      return {
        ...account,
        balance:
          initialBalance +
          incomeTotal +
          transfersInTotal -
          expenseTotal -
          transfersOutTotal,
      };
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching accounts with balances:", error);
    return [];
  }
}
