import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { Prisma } from "@prisma/client";
import type { DateRange, ReportSummary, CategoryBreakdown } from "@/types";
import { getAccountsWithBalances } from "@/features/accounts/queries";

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

/**
 * Get a comprehensive report summary for a date range
 */
export async function getReportSummary(
  dateRange: DateRange
): Promise<ReportSummary> {
  await requireAuth();
  const [accountBalances, incomeByCategory, expenseByCategory] =
    await Promise.all([
      getAccountsWithBalances(),
      getIncomeByCategory(dateRange),
      getExpenseByCategory(dateRange),
    ]);

  const totalIncome = incomeByCategory.reduce((sum, cat) => sum + cat.total, 0);
  const totalExpenses = expenseByCategory.reduce(
    (sum, cat) => sum + cat.total,
    0
  );
  const netBalance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    accountBalances,
    incomeByCategory,
    expenseByCategory,
  };
}

/**
 * Get income breakdown by category for a date range
 */
export async function getIncomeByCategory(
  dateRange: DateRange
): Promise<CategoryBreakdown[]> {
  try {
    const { userId } = await requireAuth();
    const grouped = await prisma.income.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      _sum: { amount: true },
    });

    if (grouped.length === 0) {
      return [];
    }

    const categories = await prisma.category.findMany({
      where: {
        userId,
        id: { in: grouped.map((row) => row.categoryId) },
      },
      select: { id: true, name: true },
    });
    const categoryNames = new Map(
      categories.map((category) => [category.id, category.name])
    );

    // Calculate percentages
    const totals = grouped.map((row) => ({
      categoryId: row.categoryId,
      total: row._sum.amount?.toNumber() ?? 0,
    }));
    const totalIncome = totals.reduce((sum, row) => sum + row.total, 0);

    const breakdown: CategoryBreakdown[] = totals.map((row) => ({
      categoryId: row.categoryId,
      categoryName: categoryNames.get(row.categoryId) ?? "Unknown",
      total: row.total,
      percentage: totalIncome > 0 ? (row.total / totalIncome) * 100 : 0,
    }));

    // Sort by total descending
    return breakdown.sort((a, b) => b.total - a.total);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching income by category:", error);
    return [];
  }
}

/**
 * Get expense breakdown by category for a date range
 */
export async function getExpenseByCategory(
  dateRange: DateRange
): Promise<CategoryBreakdown[]> {
  try {
    const { userId } = await requireAuth();
    const grouped = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      _sum: { amount: true },
    });

    if (grouped.length === 0) {
      return [];
    }

    const categories = await prisma.category.findMany({
      where: {
        userId,
        id: { in: grouped.map((row) => row.categoryId) },
      },
      select: { id: true, name: true },
    });
    const categoryNames = new Map(
      categories.map((category) => [category.id, category.name])
    );

    // Calculate percentages
    const totals = grouped.map((row) => ({
      categoryId: row.categoryId,
      total: row._sum.amount?.toNumber() ?? 0,
    }));
    const totalExpenses = totals.reduce((sum, row) => sum + row.total, 0);

    const breakdown: CategoryBreakdown[] = totals.map((row) => ({
      categoryId: row.categoryId,
      categoryName: categoryNames.get(row.categoryId) ?? "Unknown",
      total: row.total,
      percentage: totalExpenses > 0 ? (row.total / totalExpenses) * 100 : 0,
    }));

    // Sort by total descending
    return breakdown.sort((a, b) => b.total - a.total);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching expense by category:", error);
    return [];
  }
}

/**
 * Get monthly trends for income and expenses
 */
export async function getMonthlyTrends(
  months: number = 12
): Promise<MonthlyTrend[]> {
  try {
    const { userId } = await requireAuth();
    // Calculate start date (beginning of month, X months ago)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    type MonthlyRow = { month: string; total: Prisma.Decimal | null };
    const [incomeRows, expenseRows] = await Promise.all([
      prisma.$queryRaw<MonthlyRow[]>`
        SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS month, SUM(amount) AS total
        FROM incomes
        WHERE user_id = ${userId}
          AND date >= ${startDate}
          AND date <= ${endDate}
        GROUP BY 1
      `,
      prisma.$queryRaw<MonthlyRow[]>`
        SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS month, SUM(amount) AS total
        FROM expenses
        WHERE user_id = ${userId}
          AND date >= ${startDate}
          AND date <= ${endDate}
        GROUP BY 1
      `,
    ]);

    // Initialize monthly data
    const monthlyData = new Map<string, { income: number; expenses: number }>();

    // Create entries for all months in range
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = formatMonthKey(current);
      monthlyData.set(key, { income: 0, expenses: 0 });
      current.setMonth(current.getMonth() + 1);
    }

    // Apply income aggregates
    for (const row of incomeRows) {
      const key = row.month;
      const existing = monthlyData.get(key);
      if (existing) {
        existing.income += row.total?.toNumber() ?? 0;
      }
    }

    // Apply expense aggregates
    for (const row of expenseRows) {
      const key = row.month;
      const existing = monthlyData.get(key);
      if (existing) {
        existing.expenses += row.total?.toNumber() ?? 0;
      }
    }

    // Convert to array and format
    const result: MonthlyTrend[] = [];
    for (const [month, data] of monthlyData) {
      result.push({
        month,
        income: data.income,
        expenses: data.expenses,
      });
    }

    // Sort by date
    return result.sort((a, b) => {
      const [aYear, aMonth] = a.month.split("-").map(Number);
      const [bYear, bMonth] = b.month.split("-").map(Number);
      return aYear * 12 + aMonth - (bYear * 12 + bMonth);
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching monthly trends:", error);
    return [];
  }
}

/**
 * Format a date as "YYYY-MM" for grouping
 */
function formatMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
