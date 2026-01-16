import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
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
    // Fetch all incomes with their categories in the date range
    const incomes = await prisma.income.findMany({
      where: {
        userId,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      include: {
        category: true,
      },
    });

    // Group by category
    const categoryTotals = new Map<
      string,
      { categoryId: string; categoryName: string; total: number }
    >();

    for (const income of incomes) {
      const existing = categoryTotals.get(income.categoryId);
      if (existing) {
        existing.total += income.amount.toNumber();
      } else {
        categoryTotals.set(income.categoryId, {
          categoryId: income.categoryId,
          categoryName: income.category.name,
          total: income.amount.toNumber(),
        });
      }
    }

    // Calculate percentages
    const totalIncome = Array.from(categoryTotals.values()).reduce(
      (sum, cat) => sum + cat.total,
      0
    );

    const breakdown: CategoryBreakdown[] = Array.from(
      categoryTotals.values()
    ).map((cat) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      total: cat.total,
      percentage: totalIncome > 0 ? (cat.total / totalIncome) * 100 : 0,
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
    // Fetch all expenses with their categories in the date range
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      include: {
        category: true,
      },
    });

    // Group by category
    const categoryTotals = new Map<
      string,
      { categoryId: string; categoryName: string; total: number }
    >();

    for (const expense of expenses) {
      const existing = categoryTotals.get(expense.categoryId);
      if (existing) {
        existing.total += expense.amount.toNumber();
      } else {
        categoryTotals.set(expense.categoryId, {
          categoryId: expense.categoryId,
          categoryName: expense.category.name,
          total: expense.amount.toNumber(),
        });
      }
    }

    // Calculate percentages
    const totalExpenses = Array.from(categoryTotals.values()).reduce(
      (sum, cat) => sum + cat.total,
      0
    );

    const breakdown: CategoryBreakdown[] = Array.from(
      categoryTotals.values()
    ).map((cat) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      total: cat.total,
      percentage: totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0,
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

    // Fetch incomes and expenses in parallel
    const [incomes, expenses] = await Promise.all([
      prisma.income.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          amount: true,
          date: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          amount: true,
          date: true,
        },
      }),
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

    // Aggregate incomes by month
    for (const income of incomes) {
      const date = new Date(income.date);
      const key = formatMonthKey(date);
      const existing = monthlyData.get(key);
      if (existing) {
        existing.income += income.amount.toNumber();
      }
    }

    // Aggregate expenses by month
    for (const expense of expenses) {
      const date = new Date(expense.date);
      const key = formatMonthKey(date);
      const existing = monthlyData.get(key);
      if (existing) {
        existing.expenses += expense.amount.toNumber();
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
