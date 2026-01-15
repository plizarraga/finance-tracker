"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/db";
import type { Income, ActionResult, IncomeRow } from "@/types";
import { toIncome } from "@/types";
import { incomeServerSchema } from "./schemas";

export async function createIncome(
  formData: FormData
): Promise<ActionResult<Income>> {
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

    const validationResult = incomeServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const { accountId, categoryId, amount, date, description } =
      validationResult.data;

    const supabase = createServerClient();

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", accountId)
      .eq("user_id", session.user.id)
      .single();

    if (accountError || !account) {
      return { success: false, error: "Invalid account" };
    }

    // Verify category belongs to user and is income type
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", categoryId)
      .eq("user_id", session.user.id)
      .single();

    if (categoryError || !category) {
      return { success: false, error: "Invalid category" };
    }

    if (category.type !== "income") {
      return { success: false, error: "Category must be an income type" };
    }

    const { data, error } = await supabase
      .from("incomes")
      .insert({
        user_id: session.user.id,
        account_id: accountId,
        category_id: categoryId,
        amount,
        date: date.toISOString(),
        description,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating income:", error);
      return { success: false, error: "Failed to create income" };
    }

    revalidatePath("/incomes");
    revalidatePath("/accounts");

    return { success: true, data: toIncome(data as IncomeRow) };
  } catch (error) {
    console.error("Error in createIncome:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateIncome(
  id: string,
  formData: FormData
): Promise<ActionResult<Income>> {
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

    const validationResult = incomeServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const { accountId, categoryId, amount, date, description } =
      validationResult.data;

    const supabase = createServerClient();

    // First verify the income belongs to the user
    const { data: existingIncome, error: fetchError } = await supabase
      .from("incomes")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (fetchError || !existingIncome) {
      return { success: false, error: "Income not found" };
    }

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", accountId)
      .eq("user_id", session.user.id)
      .single();

    if (accountError || !account) {
      return { success: false, error: "Invalid account" };
    }

    // Verify category belongs to user and is income type
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", categoryId)
      .eq("user_id", session.user.id)
      .single();

    if (categoryError || !category) {
      return { success: false, error: "Invalid category" };
    }

    if (category.type !== "income") {
      return { success: false, error: "Category must be an income type" };
    }

    const { data, error } = await supabase
      .from("incomes")
      .update({
        account_id: accountId,
        category_id: categoryId,
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
      console.error("Error updating income:", error);
      return { success: false, error: "Failed to update income" };
    }

    revalidatePath("/incomes");
    revalidatePath(`/incomes/${id}`);
    revalidatePath("/accounts");

    return { success: true, data: toIncome(data as IncomeRow) };
  } catch (error) {
    console.error("Error in updateIncome:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteIncome(id: string): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createServerClient();

    // First verify the income belongs to the user
    const { data: existingIncome, error: fetchError } = await supabase
      .from("incomes")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (fetchError || !existingIncome) {
      return { success: false, error: "Income not found" };
    }

    const { error } = await supabase
      .from("incomes")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error deleting income:", error);
      return { success: false, error: "Failed to delete income" };
    }

    revalidatePath("/incomes");
    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteIncome:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
