"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth, prisma } from "@/lib/auth";
import type { Account, ActionResult } from "@/types";
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

    const account = await prisma.account.create({
      data: {
        userId: session.user.id,
        name,
        description,
      },
    });

    revalidatePath("/accounts");

    return { success: true, data: account };
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

    // Verify the account belongs to the user
    const existingAccount = await prisma.account.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingAccount) {
      return { success: false, error: "Account not found" };
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    revalidatePath("/accounts");
    revalidatePath(`/accounts/${id}`);

    return { success: true, data: account };
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

    // Verify the account belongs to the user
    const existingAccount = await prisma.account.findFirst({
      where: { id, userId: session.user.id },
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
    console.error("Error in deleteAccount:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
