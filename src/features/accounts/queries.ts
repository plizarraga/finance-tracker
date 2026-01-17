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
    const [incomeSum, expenseSum, transfersInSum, transfersOutSum] =
      await Promise.all([
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

    return (
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
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });

    const accountsWithBalances = await Promise.all(
      accounts.map(async (account) => ({
        ...account,
        balance: await calculateAccountBalance(account.id),
      }))
    );

    return accountsWithBalances;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching accounts with balances:", error);
    return [];
  }
}
