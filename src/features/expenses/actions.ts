"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/db";
import type { Expense, ActionResult, ExpenseRow } from "@/types";
import { toExpense } from "@/types";
import { expenseServerSchema } from "./schemas";

export async function createExpense(
  formData: FormData
): Promise<ActionResult<Expense>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const rawData = {
      accountId: formData.get("accountId"),
      categoryId: formData.get("categoryId"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      description: formData.get("description") || null,
    };

    const validationResult = expenseServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const { accountId, categoryId, amount, date, description } =
      validationResult.data;

    const supabase = createServerClient();

    // Verify the account belongs to the user
    const { data: existingAccount, error: accountError } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", accountId)
      .eq("user_id", session.user.id)
      .single();

    if (accountError || !existingAccount) {
      return { success: false, error: "Invalid account" };
    }

    // Verify the category belongs to the user and is of type expense
    const { data: existingCategory, error: categoryError } = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", categoryId)
      .eq("user_id", session.user.id)
      .single();

    if (categoryError || !existingCategory) {
      return { success: false, error: "Invalid category" };
    }

    if (existingCategory.type !== "expense") {
      return { success: false, error: "Category must be of type expense" };
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: session.user.id,
        account_id: accountId,
        category_id: categoryId,
        amount,
        date: date.toISOString().split("T")[0],
        description,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating expense:", error);
      return { success: false, error: "Failed to create expense" };
    }

    revalidatePath("/expenses");
    revalidatePath("/accounts");

    return { success: true, data: toExpense(data as ExpenseRow) };
  } catch (error) {
    console.error("Error in createExpense:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateExpense(
  id: string,
  formData: FormData
): Promise<ActionResult<Expense>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const rawData = {
      accountId: formData.get("accountId"),
      categoryId: formData.get("categoryId"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      description: formData.get("description") || null,
    };

    const validationResult = expenseServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const { accountId, categoryId, amount, date, description } =
      validationResult.data;

    const supabase = createServerClient();

    // First verify the expense belongs to the user
    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (fetchError || !existingExpense) {
      return { success: false, error: "Expense not found" };
    }

    // Verify the account belongs to the user
    const { data: existingAccount, error: accountError } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", accountId)
      .eq("user_id", session.user.id)
      .single();

    if (accountError || !existingAccount) {
      return { success: false, error: "Invalid account" };
    }

    // Verify the category belongs to the user and is of type expense
    const { data: existingCategory, error: categoryError } = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", categoryId)
      .eq("user_id", session.user.id)
      .single();

    if (categoryError || !existingCategory) {
      return { success: false, error: "Invalid category" };
    }

    if (existingCategory.type !== "expense") {
      return { success: false, error: "Category must be of type expense" };
    }

    const { data, error } = await supabase
      .from("expenses")
      .update({
        account_id: accountId,
        category_id: categoryId,
        amount,
        date: date.toISOString().split("T")[0],
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating expense:", error);
      return { success: false, error: "Failed to update expense" };
    }

    revalidatePath("/expenses");
    revalidatePath(`/expenses/${id}`);
    revalidatePath("/accounts");

    return { success: true, data: toExpense(data as ExpenseRow) };
  } catch (error) {
    console.error("Error in updateExpense:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createServerClient();

    // First verify the expense belongs to the user
    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (fetchError || !existingExpense) {
      return { success: false, error: "Expense not found" };
    }

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error deleting expense:", error);
      return { success: false, error: "Failed to delete expense" };
    }

    revalidatePath("/expenses");
    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteExpense:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
