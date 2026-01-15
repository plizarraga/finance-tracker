import { createServerClient } from "@/lib/db";
import type {
  TransferWithRelations,
  TransferRow,
  AccountRow,
  DateRange,
} from "@/types";
import { toTransfer, toAccount } from "@/types";

interface TransferFilters {
  dateRange?: DateRange;
  accountId?: string;
}

interface TransferRowWithAccounts extends TransferRow {
  from_account: AccountRow;
  to_account: AccountRow;
}

export async function getTransfers(
  userId: string,
  filters?: TransferFilters
): Promise<TransferWithRelations[]> {
  const supabase = createServerClient();

  let query = supabase
    .from("transfers")
    .select(
      `
      *,
      from_account:accounts!transfers_from_account_id_fkey(*),
      to_account:accounts!transfers_to_account_id_fkey(*)
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
    query = query.or(
      `from_account_id.eq.${filters.accountId},to_account_id.eq.${filters.accountId}`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching transfers:", error);
    return [];
  }

  return (data as TransferRowWithAccounts[]).map((row) => ({
    ...toTransfer(row),
    fromAccount: toAccount(row.from_account),
    toAccount: toAccount(row.to_account),
  }));
}

export async function getTransferById(
  id: string,
  userId: string
): Promise<TransferWithRelations | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("transfers")
    .select(
      `
      *,
      from_account:accounts!transfers_from_account_id_fkey(*),
      to_account:accounts!transfers_to_account_id_fkey(*)
    `
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching transfer:", error);
    return null;
  }

  const row = data as TransferRowWithAccounts;

  return {
    ...toTransfer(row),
    fromAccount: toAccount(row.from_account),
    toAccount: toAccount(row.to_account),
  };
}
