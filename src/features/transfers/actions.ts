"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/db";
import type { Transfer, ActionResult, TransferRow } from "@/types";
import { toTransfer } from "@/types";
import { transferServerSchema } from "./schemas";

export async function createTransfer(
  formData: FormData
): Promise<ActionResult<Transfer>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const rawData = {
      fromAccountId: formData.get("fromAccountId"),
      toAccountId: formData.get("toAccountId"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      description: formData.get("description") || null,
    };

    const validationResult = transferServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const { fromAccountId, toAccountId, amount, date, description } =
      validationResult.data;

    const supabase = createServerClient();

    // Verify both accounts belong to the user
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", session.user.id)
      .in("id", [fromAccountId, toAccountId]);

    if (accountsError || !accounts || accounts.length !== 2) {
      return { success: false, error: "Invalid account selection" };
    }

    const { data, error } = await supabase
      .from("transfers")
      .insert({
        user_id: session.user.id,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount,
        date: date.toISOString(),
        description,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating transfer:", error);
      return { success: false, error: "Failed to create transfer" };
    }

    revalidatePath("/transfers");
    revalidatePath("/accounts");

    return { success: true, data: toTransfer(data as TransferRow) };
  } catch (error) {
    console.error("Error in createTransfer:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateTransfer(
  id: string,
  formData: FormData
): Promise<ActionResult<Transfer>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const rawData = {
      fromAccountId: formData.get("fromAccountId"),
      toAccountId: formData.get("toAccountId"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      description: formData.get("description") || null,
    };

    const validationResult = transferServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const { fromAccountId, toAccountId, amount, date, description } =
      validationResult.data;

    const supabase = createServerClient();

    // First verify the transfer belongs to the user
    const { data: existingTransfer, error: fetchError } = await supabase
      .from("transfers")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (fetchError || !existingTransfer) {
      return { success: false, error: "Transfer not found" };
    }

    // Verify both accounts belong to the user
    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", session.user.id)
      .in("id", [fromAccountId, toAccountId]);

    if (accountsError || !accounts || accounts.length !== 2) {
      return { success: false, error: "Invalid account selection" };
    }

    const { data, error } = await supabase
      .from("transfers")
      .update({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount,
        date: date.toISOString(),
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating transfer:", error);
      return { success: false, error: "Failed to update transfer" };
    }

    revalidatePath("/transfers");
    revalidatePath("/accounts");
    revalidatePath(`/transfers/${id}`);

    return { success: true, data: toTransfer(data as TransferRow) };
  } catch (error) {
    console.error("Error in updateTransfer:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteTransfer(id: string): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createServerClient();

    // First verify the transfer belongs to the user
    const { data: existingTransfer, error: fetchError } = await supabase
      .from("transfers")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (fetchError || !existingTransfer) {
      return { success: false, error: "Transfer not found" };
    }

    const { error } = await supabase
      .from("transfers")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error deleting transfer:", error);
      return { success: false, error: "Failed to delete transfer" };
    }

    revalidatePath("/transfers");
    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteTransfer:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
