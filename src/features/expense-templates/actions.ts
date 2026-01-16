"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import type { ActionResult } from "@/types";
import { expenseTemplateServerSchema } from "./schemas";

export async function createExpenseTemplate(
  formData: FormData
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    const rawData = {
      name: formData.get("name"),
      accountId: formData.get("accountId") || null,
      categoryId: formData.get("categoryId") || null,
      amount: formData.get("amount") || null,
      description: formData.get("description") || null,
    };

    const validationResult = expenseTemplateServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const { name, accountId, categoryId, amount, description } =
      validationResult.data;

    // Validate account belongs to user (if provided)
    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId },
      });
      if (!account) {
        return { success: false, error: "Invalid account" };
      }
    }

    // Validate category belongs to user and is expense type (if provided)
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId, type: "expense" },
      });
      if (!category) {
        return {
          success: false,
          error: "Invalid category or category is not expense type",
        };
      }
    }

    await prisma.expenseTemplate.create({
      data: {
        userId,
        name,
        accountId,
        categoryId,
        amount,
        description,
        isDefault: false,
      },
    });

    revalidatePath("/expenses/templates");
    revalidatePath("/expenses");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in createExpenseTemplate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateExpenseTemplate(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    const rawData = {
      name: formData.get("name"),
      accountId: formData.get("accountId") || null,
      categoryId: formData.get("categoryId") || null,
      amount: formData.get("amount") || null,
      description: formData.get("description") || null,
    };

    const validationResult = expenseTemplateServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const { name, accountId, categoryId, amount, description } =
      validationResult.data;

    // Verify template belongs to user
    const existingTemplate = await prisma.expenseTemplate.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return { success: false, error: "Template not found" };
    }

    // Validate account (if provided)
    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId },
      });
      if (!account) {
        return { success: false, error: "Invalid account" };
      }
    }

    // Validate category (if provided)
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId, type: "expense" },
      });
      if (!category) {
        return {
          success: false,
          error: "Invalid category or category is not expense type",
        };
      }
    }

    await prisma.expenseTemplate.update({
      where: { id },
      data: {
        name,
        accountId,
        categoryId,
        amount,
        description,
      },
    });

    revalidatePath("/expenses/templates");
    revalidatePath(`/expenses/templates/${id}/edit`);
    revalidatePath("/expenses");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in updateExpenseTemplate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteExpenseTemplate(id: string): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    // Verify template belongs to user
    const existingTemplate = await prisma.expenseTemplate.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return { success: false, error: "Template not found" };
    }

    await prisma.expenseTemplate.delete({
      where: { id },
    });

    revalidatePath("/expenses/templates");
    revalidatePath("/expenses");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in deleteExpenseTemplate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function duplicateExpenseTemplate(id: string): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    // Get original template
    const original = await prisma.expenseTemplate.findFirst({
      where: { id, userId },
    });

    if (!original) {
      return { success: false, error: "Template not found" };
    }

    // Create duplicate with " (Copy)" appended to name
    await prisma.expenseTemplate.create({
      data: {
        userId,
        name: `${original.name} (Copy)`,
        accountId: original.accountId,
        categoryId: original.categoryId,
        amount: original.amount,
        description: original.description,
        isDefault: false,
      },
    });

    revalidatePath("/expenses/templates");
    revalidatePath("/expenses");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in duplicateExpenseTemplate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function setDefaultExpenseTemplate(
  id: string | null
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    // If id is null, just unset current default
    if (id === null) {
      await prisma.expenseTemplate.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      revalidatePath("/expenses/templates");
      revalidatePath("/expenses");
      return { success: true };
    }

    // Verify template belongs to user
    const template = await prisma.expenseTemplate.findFirst({
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
      prisma.expenseTemplate.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      // Set new default
      prisma.expenseTemplate.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    revalidatePath("/expenses/templates");
    revalidatePath("/expenses");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in setDefaultExpenseTemplate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
