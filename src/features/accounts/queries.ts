import { createServerClient } from "@/lib/db";
import type { Account, AccountWithBalance, AccountRow } from "@/types";
import { toAccount } from "@/types";

export async function getAccounts(userId: string): Promise<Account[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }

  return (data as AccountRow[]).map(toAccount);
}

export async function getAccountById(
  id: string,
  userId: string
): Promise<Account | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching account:", error);
    return null;
  }

  return toAccount(data as AccountRow);
}

export async function getAccountsWithBalances(
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

  // Calculate balance for each account using SQL subqueries
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

      // Calculate balance: income + transfers_in - expenses - transfers_out
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
