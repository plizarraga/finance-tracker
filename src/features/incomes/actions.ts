"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import type { ActionResult } from "@/types";
import { incomeServerSchema } from "./schemas";

export async function createIncome(
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

    const validationResult = incomeServerSchema.safeParse(rawData);

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

    // Verify category belongs to user and is income type
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
        type: "income",
      },
    });

    if (!category) {
      return {
        success: false,
        error: "Invalid category or category is not income type",
      };
    }

    await prisma.income.create({
      data: {
        userId,
        accountId,
        categoryId,
        amount,
        date,
        description,
      },
    });

    revalidatePath("/incomes");
    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in createIncome:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateIncome(
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

    const validationResult = incomeServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const { accountId, categoryId, amount, date, description } =
      validationResult.data;

    // Verify the income belongs to the user
    const existingIncome = await prisma.income.findFirst({
      where: { id, userId },
    });

    if (!existingIncome) {
      return { success: false, error: "Income not found" };
    }

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return { success: false, error: "Invalid account" };
    }

    // Verify category belongs to user and is income type
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
        type: "income",
      },
    });

    if (!category) {
      return {
        success: false,
        error: "Invalid category or category is not income type",
      };
    }

    await prisma.income.update({
      where: { id },
      data: {
        accountId,
        categoryId,
        amount,
        date,
        description,
      },
    });

    revalidatePath("/incomes");
    revalidatePath(`/incomes/${id}`);
    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in updateIncome:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteIncome(id: string): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    // Verify the income belongs to the user
    const existingIncome = await prisma.income.findFirst({
      where: { id, userId },
    });

    if (!existingIncome) {
      return { success: false, error: "Income not found" };
    }

    await prisma.income.delete({
      where: { id },
    });

    revalidatePath("/incomes");
    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in deleteIncome:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
