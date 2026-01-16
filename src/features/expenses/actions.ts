"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import type { ActionResult } from "@/types";
import { expenseServerSchema } from "./schemas";

export async function createExpense(
  formData: FormData
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

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

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return { success: false, error: "Invalid account" };
    }

    // Verify category belongs to user and is expense type
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
        type: "expense",
      },
    });

    if (!category) {
      return {
        success: false,
        error: "Invalid category or category is not expense type",
      };
    }

    await prisma.expense.create({
      data: {
        userId,
        accountId,
        categoryId,
        amount,
        date,
        description,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in createExpense:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateExpense(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

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

    // Verify the expense belongs to the user
    const existingExpense = await prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!existingExpense) {
      return { success: false, error: "Expense not found" };
    }

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return { success: false, error: "Invalid account" };
    }

    // Verify category belongs to user and is expense type
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
        type: "expense",
      },
    });

    if (!category) {
      return {
        success: false,
        error: "Invalid category or category is not expense type",
      };
    }

    await prisma.expense.update({
      where: { id },
      data: {
        accountId,
        categoryId,
        amount,
        date,
        description,
      },
    });

    revalidatePath("/expenses");
    revalidatePath(`/expenses/${id}`);
    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in updateExpense:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    // Verify the expense belongs to the user
    const existingExpense = await prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!existingExpense) {
      return { success: false, error: "Expense not found" };
    }

    await prisma.expense.delete({
      where: { id },
    });

    revalidatePath("/expenses");
    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in deleteExpense:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
