import { createServerClient } from "@/lib/db";
import type {
  DateRange,
  ReportSummary,
  CategoryBreakdown,
  AccountWithBalance,
  AccountRow,
  IncomeRow,
  ExpenseRow,
  CategoryRow,
} from "@/types";
import { toAccount } from "@/types";

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

/**
 * Get a comprehensive report summary for a date range
 */
export async function getReportSummary(
  userId: string,
  dateRange: DateRange
): Promise<ReportSummary> {
  const [accountBalances, incomeByCategory, expenseByCategory] =
    await Promise.all([
      getAccountBalances(userId),
      getIncomeByCategory(userId, dateRange),
      getExpenseByCategory(userId, dateRange),
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
  userId: string,
  dateRange: DateRange
): Promise<CategoryBreakdown[]> {
  const supabase = createServerClient();

  // Fetch all incomes with their categories in the date range
  const { data: incomes, error } = await supabase
    .from("incomes")
    .select(
      `
      amount,
      categories!inner(id, name)
    `
    )
    .eq("user_id", userId)
    .gte("date", dateRange.from.toISOString())
    .lte("date", dateRange.to.toISOString());

  if (error) {
    console.error("Error fetching income by category:", error);
    return [];
  }

  // Group by category
  const categoryTotals = new Map<
    string,
    { categoryId: string; categoryName: string; total: number }
  >();

  for (const income of incomes || []) {
    const cat = income.categories as unknown as CategoryRow;
    const existing = categoryTotals.get(cat.id);
    if (existing) {
      existing.total += income.amount;
    } else {
      categoryTotals.set(cat.id, {
        categoryId: cat.id,
        categoryName: cat.name,
        total: income.amount,
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
}

/**
 * Get expense breakdown by category for a date range
 */
export async function getExpenseByCategory(
  userId: string,
  dateRange: DateRange
): Promise<CategoryBreakdown[]> {
  const supabase = createServerClient();

  // Fetch all expenses with their categories in the date range
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select(
      `
      amount,
      categories!inner(id, name)
    `
    )
    .eq("user_id", userId)
    .gte("date", dateRange.from.toISOString())
    .lte("date", dateRange.to.toISOString());

  if (error) {
    console.error("Error fetching expense by category:", error);
    return [];
  }

  // Group by category
  const categoryTotals = new Map<
    string,
    { categoryId: string; categoryName: string; total: number }
  >();

  for (const expense of expenses || []) {
    const cat = expense.categories as unknown as CategoryRow;
    const existing = categoryTotals.get(cat.id);
    if (existing) {
      existing.total += expense.amount;
    } else {
      categoryTotals.set(cat.id, {
        categoryId: cat.id,
        categoryName: cat.name,
        total: expense.amount,
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
}

/**
 * Get monthly trends for income and expenses
 */
export async function getMonthlyTrends(
  userId: string,
  months: number = 12
): Promise<MonthlyTrend[]> {
  const supabase = createServerClient();

  // Calculate start date (beginning of month, X months ago)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  // Fetch incomes in the range
  const { data: incomes } = await supabase
    .from("incomes")
    .select("amount, date")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString())
    .lte("date", endDate.toISOString());

  // Fetch expenses in the range
  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount, date")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString())
    .lte("date", endDate.toISOString());

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
  for (const income of incomes || []) {
    const date = new Date(income.date);
    const key = formatMonthKey(date);
    const existing = monthlyData.get(key);
    if (existing) {
      existing.income += income.amount;
    }
  }

  // Aggregate expenses by month
  for (const expense of expenses || []) {
    const date = new Date(expense.date);
    const key = formatMonthKey(date);
    const existing = monthlyData.get(key);
    if (existing) {
      existing.expenses += expense.amount;
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
}

/**
 * Get account balances (helper function)
 */
async function getAccountBalances(
  userId: string
): Promise<AccountWithBalance[]> {
  const supabase = createServerClient();

  // Fetch accounts
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (accountsError) {
    console.error("Error fetching accounts:", accountsError);
    return [];
  }

  // Calculate balance for each account
  const accountsWithBalances: AccountWithBalance[] = await Promise.all(
    (accounts as AccountRow[]).map(async (account) => {
      // Get total income for this account
      const { data: incomeData } = await supabase
        .from("incomes")
        .select("amount")
        .eq("account_id", account.id);

      const totalIncome = (incomeData || []).reduce(
        (sum, row) => sum + (row.amount || 0),
        0
      );

      // Get total expenses for this account
      const { data: expenseData } = await supabase
        .from("expenses")
        .select("amount")
        .eq("account_id", account.id);

      const totalExpenses = (expenseData || []).reduce(
        (sum, row) => sum + (row.amount || 0),
        0
      );

      // Get transfers in (to this account)
      const { data: transfersIn } = await supabase
        .from("transfers")
        .select("amount")
        .eq("to_account_id", account.id);

      const totalTransfersIn = (transfersIn || []).reduce(
        (sum, row) => sum + (row.amount || 0),
        0
      );

      // Get transfers out (from this account)
      const { data: transfersOut } = await supabase
        .from("transfers")
        .select("amount")
        .eq("from_account_id", account.id);

      const totalTransfersOut = (transfersOut || []).reduce(
        (sum, row) => sum + (row.amount || 0),
        0
      );

      // Calculate balance
      const balance =
        totalIncome + totalTransfersIn - totalExpenses - totalTransfersOut;

      return {
        ...toAccount(account),
        balance,
      };
    })
  );

  return accountsWithBalances;
}

/**
 * Format a date as "YYYY-MM" for grouping
 */
function formatMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
