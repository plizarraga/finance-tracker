"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { transferTemplateServerSchema } from "./schemas";
import type { ActionResult } from "@/types";

export async function createTransferTemplate(
  formData: FormData
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    const rawData = {
      name: formData.get("name"),
      fromAccountId: formData.get("fromAccountId") || null,
      toAccountId: formData.get("toAccountId") || null,
      amount: formData.get("amount") || null,
      description: formData.get("description") || null,
    };

    const validatedData = transferTemplateServerSchema.parse(rawData);

    // Verify accounts belong to user if provided
    if (validatedData.fromAccountId) {
      const fromAccount = await prisma.account.findFirst({
        where: { id: validatedData.fromAccountId, userId },
      });
      if (!fromAccount) {
        return { success: false, error: "Invalid from account" };
      }
    }

    if (validatedData.toAccountId) {
      const toAccount = await prisma.account.findFirst({
        where: { id: validatedData.toAccountId, userId },
      });
      if (!toAccount) {
        return { success: false, error: "Invalid to account" };
      }
    }

    await prisma.transferTemplate.create({
      data: {
        userId,
        name: validatedData.name,
        fromAccountId: validatedData.fromAccountId,
        toAccountId: validatedData.toAccountId,
        amount: validatedData.amount,
        description: validatedData.description,
        isDefault: false,
      },
    });

    revalidatePath("/transfers");
    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error creating transfer template:", error);
    return { success: false, error: "Failed to create template" };
  }
}

export async function updateTransferTemplate(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    // Verify ownership
    const existingTemplate = await prisma.transferTemplate.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return { success: false, error: "Template not found" };
    }

    const rawData = {
      name: formData.get("name"),
      fromAccountId: formData.get("fromAccountId") || null,
      toAccountId: formData.get("toAccountId") || null,
      amount: formData.get("amount") || null,
      description: formData.get("description") || null,
    };

    const validatedData = transferTemplateServerSchema.parse(rawData);

    // Verify accounts belong to user if provided
    if (validatedData.fromAccountId) {
      const fromAccount = await prisma.account.findFirst({
        where: { id: validatedData.fromAccountId, userId },
      });
      if (!fromAccount) {
        return { success: false, error: "Invalid from account" };
      }
    }

    if (validatedData.toAccountId) {
      const toAccount = await prisma.account.findFirst({
        where: { id: validatedData.toAccountId, userId },
      });
      if (!toAccount) {
        return { success: false, error: "Invalid to account" };
      }
    }

    await prisma.transferTemplate.update({
      where: { id },
      data: {
        name: validatedData.name,
        fromAccountId: validatedData.fromAccountId,
        toAccountId: validatedData.toAccountId,
        amount: validatedData.amount,
        description: validatedData.description,
      },
    });

    revalidatePath("/transfers");
    revalidatePath(`/transfers/templates/${id}/edit`);
    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error updating transfer template:", error);
    return { success: false, error: "Failed to update template" };
  }
}

export async function deleteTransferTemplate(
  id: string
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    // Verify ownership
    const template = await prisma.transferTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    await prisma.transferTemplate.delete({
      where: { id },
    });

    revalidatePath("/transfers");
    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error deleting transfer template:", error);
    return { success: false, error: "Failed to delete template" };
  }
}

export async function duplicateTransferTemplate(
  id: string
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    const template = await prisma.transferTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    await prisma.transferTemplate.create({
      data: {
        userId,
        name: `${template.name} (Copy)`,
        fromAccountId: template.fromAccountId,
        toAccountId: template.toAccountId,
        amount: template.amount,
        description: template.description,
        isDefault: false, // Never copy default status
      },
    });

    revalidatePath("/transfers");
    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error duplicating transfer template:", error);
    return { success: false, error: "Failed to duplicate template" };
  }
}

export async function setDefaultTransferTemplate(
  id: string | null
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    if (id === null) {
      // Unset current default
      await prisma.transferTemplate.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
      revalidatePath("/transfers");
      return { success: true };
    }

    // Verify ownership
    const template = await prisma.transferTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    // If already default, no-op
    if (template.isDefault) {
      return { success: true };
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction([
      // Unset current default
      prisma.transferTemplate.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      // Set new default
      prisma.transferTemplate.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    revalidatePath("/transfers");
    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error setting default transfer template:", error);
    return { success: false, error: "Failed to set default template" };
  }
}
