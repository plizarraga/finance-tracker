"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth, prisma } from "@/lib/auth";
import type { Income } from "@prisma/client";
import type { ActionResult } from "@/types";
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

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: session.user.id },
    });

    if (!account) {
      return { success: false, error: "Invalid account" };
    }

    // Verify category belongs to user and is income type
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id,
        type: "income",
      },
    });

    if (!category) {
      return {
        success: false,
        error: "Invalid category or category is not income type",
      };
    }

    const income = await prisma.income.create({
      data: {
        userId: session.user.id,
        accountId,
        categoryId,
        amount,
        date,
        description,
      },
    });

    revalidatePath("/incomes");
    revalidatePath("/accounts");

    return { success: true, data: income };
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

    // Verify the income belongs to the user
    const existingIncome = await prisma.income.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingIncome) {
      return { success: false, error: "Income not found" };
    }

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: session.user.id },
    });

    if (!account) {
      return { success: false, error: "Invalid account" };
    }

    // Verify category belongs to user and is income type
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id,
        type: "income",
      },
    });

    if (!category) {
      return {
        success: false,
        error: "Invalid category or category is not income type",
      };
    }

    const income = await prisma.income.update({
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

    return { success: true, data: income };
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

    // Verify the income belongs to the user
    const existingIncome = await prisma.income.findFirst({
      where: { id, userId: session.user.id },
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
    console.error("Error in deleteIncome:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
