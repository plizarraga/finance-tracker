"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/db";
import type { Account, ActionResult, AccountRow } from "@/types";
import { toAccount } from "@/types";
import { accountSchema } from "./schemas";

export async function createAccount(
  formData: FormData
): Promise<ActionResult<Account>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const rawData = {
      name: formData.get("name"),
      description: formData.get("description") || null,
    };

    const validationResult = accountSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const { name, description } = validationResult.data;

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("accounts")
      .insert({
        user_id: session.user.id,
        name,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating account:", error);
      return { success: false, error: "Failed to create account" };
    }

    revalidatePath("/accounts");

    return { success: true, data: toAccount(data as AccountRow) };
  } catch (error) {
    console.error("Error in createAccount:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateAccount(
  id: string,
  formData: FormData
): Promise<ActionResult<Account>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const rawData = {
      name: formData.get("name"),
      description: formData.get("description") || null,
    };

    const validationResult = accountSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const { name, description } = validationResult.data;

    const supabase = createServerClient();

    // First verify the account belongs to the user
    const { data: existingAccount, error: fetchError } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (fetchError || !existingAccount) {
      return { success: false, error: "Account not found" };
    }

    const { data, error } = await supabase
      .from("accounts")
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating account:", error);
      return { success: false, error: "Failed to update account" };
    }

    revalidatePath("/accounts");
    revalidatePath(`/accounts/${id}`);

    return { success: true, data: toAccount(data as AccountRow) };
  } catch (error) {
    console.error("Error in updateAccount:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createServerClient();

    // First verify the account belongs to the user
    const { data: existingAccount, error: fetchError } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (fetchError || !existingAccount) {
      return { success: false, error: "Account not found" };
    }

    // Check if account has any transactions
    const { data: incomes } = await supabase
      .from("incomes")
      .select("id")
      .eq("account_id", id)
      .limit(1);

    const { data: expenses } = await supabase
      .from("expenses")
      .select("id")
      .eq("account_id", id)
      .limit(1);

    const { data: transfersFrom } = await supabase
      .from("transfers")
      .select("id")
      .eq("from_account_id", id)
      .limit(1);

    const { data: transfersTo } = await supabase
      .from("transfers")
      .select("id")
      .eq("to_account_id", id)
      .limit(1);

    if (
      (incomes && incomes.length > 0) ||
      (expenses && expenses.length > 0) ||
      (transfersFrom && transfersFrom.length > 0) ||
      (transfersTo && transfersTo.length > 0)
    ) {
      return {
        success: false,
        error:
          "Cannot delete account with existing transactions. Please delete all transactions first.",
      };
    }

    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error deleting account:", error);
      return { success: false, error: "Failed to delete account" };
    }

    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteAccount:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
