"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import type { ActionResult } from "@/types";
import { accountSchema } from "./schemas";

export async function createAccount(
  formData: FormData
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const { userId } = await requireAuth();

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

    const account = await prisma.account.create({
      data: {
        userId,
        name,
        description,
      },
    });

    revalidatePath("/accounts");

    return { success: true, data: { id: account.id, name: account.name } };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in createAccount:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateAccount(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

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

    // Verify the account belongs to the user
    const existingAccount = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!existingAccount) {
      return { success: false, error: "Account not found" };
    }

    await prisma.account.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    revalidatePath("/accounts");
    revalidatePath(`/accounts/${id}`);

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in updateAccount:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    // Verify the account belongs to the user
    const existingAccount = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!existingAccount) {
      return { success: false, error: "Account not found" };
    }

    // OPTIMIZED: Check if account has any transactions using count (more efficient)
    const [incomesCount, expensesCount, transfersFromCount, transfersToCount] =
      await Promise.all([
        prisma.income.count({ where: { accountId: id } }),
        prisma.expense.count({ where: { accountId: id } }),
        prisma.transfer.count({ where: { fromAccountId: id } }),
        prisma.transfer.count({ where: { toAccountId: id } }),
      ]);

    if (
      incomesCount > 0 ||
      expensesCount > 0 ||
      transfersFromCount > 0 ||
      transfersToCount > 0
    ) {
      return {
        success: false,
        error:
          "Cannot delete account with existing transactions. Please delete all transactions first.",
      };
    }

    await prisma.account.delete({
      where: { id },
    });

    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in deleteAccount:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
