import { createServerClient } from "@/lib/db";
import type {
  ExpenseWithRelations,
  ExpenseRow,
  AccountRow,
  CategoryRow,
  DateRange,
} from "@/types";
import { toExpense, toAccount, toCategory } from "@/types";

interface ExpenseFilters {
  dateRange?: DateRange;
  accountId?: string;
  categoryId?: string;
}

interface ExpenseRowWithRelations extends ExpenseRow {
  accounts: AccountRow;
  categories: CategoryRow;
}

export async function getExpenses(
  userId: string,
  filters?: ExpenseFilters
): Promise<ExpenseWithRelations[]> {
  const supabase = createServerClient();

  let query = supabase
    .from("expenses")
    .select(
      `
      *,
      accounts!inner(*),
      categories!inner(*)
    `
    )
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (filters?.dateRange) {
    query = query
      .gte("date", filters.dateRange.from.toISOString())
      .lte("date", filters.dateRange.to.toISOString());
  }

  if (filters?.accountId) {
    query = query.eq("account_id", filters.accountId);
  }

  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }

  return (data as ExpenseRowWithRelations[]).map((row) => ({
    ...toExpense(row),
    account: toAccount(row.accounts),
    category: toCategory(row.categories),
  }));
}

export async function getExpenseById(
  id: string,
  userId: string
): Promise<ExpenseWithRelations | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      *,
      accounts!inner(*),
      categories!inner(*)
    `
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching expense:", error);
    return null;
  }

  const row = data as ExpenseRowWithRelations;

  return {
    ...toExpense(row),
    account: toAccount(row.accounts),
    category: toCategory(row.categories),
  };
}
