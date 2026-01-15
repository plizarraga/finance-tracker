import { createServerClient } from "@/lib/db";
import type {
  IncomeWithRelations,
  IncomeRow,
  AccountRow,
  CategoryRow,
  DateRange,
} from "@/types";
import { toIncome, toAccount, toCategory } from "@/types";

interface IncomeFilters {
  dateRange?: DateRange;
  accountId?: string;
  categoryId?: string;
}

interface IncomeRowWithRelations extends IncomeRow {
  accounts: AccountRow;
  categories: CategoryRow;
}

export async function getIncomes(
  userId: string,
  filters?: IncomeFilters
): Promise<IncomeWithRelations[]> {
  const supabase = createServerClient();

  let query = supabase
    .from("incomes")
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
    console.error("Error fetching incomes:", error);
    return [];
  }

  return (data as IncomeRowWithRelations[]).map((row) => ({
    ...toIncome(row),
    account: toAccount(row.accounts),
    category: toCategory(row.categories),
  }));
}

export async function getIncomeById(
  id: string,
  userId: string
): Promise<IncomeWithRelations | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("incomes")
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
    console.error("Error fetching income:", error);
    return null;
  }

  const row = data as IncomeRowWithRelations;

  return {
    ...toIncome(row),
    account: toAccount(row.accounts),
    category: toCategory(row.categories),
  };
}
