"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth, prisma } from "@/lib/auth";
import type { Transfer } from "@prisma/client";
import type { ActionResult } from "@/types";
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

    // Verify both accounts belong to the user
    const accounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
        id: { in: [fromAccountId, toAccountId] },
      },
    });

    if (accounts.length !== 2) {
      return { success: false, error: "Invalid account selection" };
    }

    const transfer = await prisma.transfer.create({
      data: {
        userId: session.user.id,
        fromAccountId,
        toAccountId,
        amount,
        date,
        description,
      },
    });

    revalidatePath("/transfers");
    revalidatePath("/accounts");

    return { success: true, data: transfer };
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

    // Verify the transfer belongs to the user
    const existingTransfer = await prisma.transfer.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingTransfer) {
      return { success: false, error: "Transfer not found" };
    }

    // Verify both accounts belong to the user
    const accounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
        id: { in: [fromAccountId, toAccountId] },
      },
    });

    if (accounts.length !== 2) {
      return { success: false, error: "Invalid account selection" };
    }

    const transfer = await prisma.transfer.update({
      where: { id },
      data: {
        fromAccountId,
        toAccountId,
        amount,
        date,
        description,
      },
    });

    revalidatePath("/transfers");
    revalidatePath("/accounts");
    revalidatePath(`/transfers/${id}`);

    return { success: true, data: transfer };
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

    // Verify the transfer belongs to the user
    const existingTransfer = await prisma.transfer.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingTransfer) {
      return { success: false, error: "Transfer not found" };
    }

    await prisma.transfer.delete({
      where: { id },
    });

    revalidatePath("/transfers");
    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteTransfer:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
