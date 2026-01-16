"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import type { ActionResult } from "@/types";
import { incomeTemplateServerSchema } from "./schemas";

export async function createIncomeTemplate(
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

    const validationResult = incomeTemplateServerSchema.safeParse(rawData);

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

    // Validate category belongs to user and is income type (if provided)
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId, type: "income" },
      });
      if (!category) {
        return {
          success: false,
          error: "Invalid category or category is not income type",
        };
      }
    }

    await prisma.incomeTemplate.create({
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

    revalidatePath("/incomes/templates");
    revalidatePath("/incomes");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in createIncomeTemplate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateIncomeTemplate(
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

    const validationResult = incomeTemplateServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    const { name, accountId, categoryId, amount, description } =
      validationResult.data;

    // Verify template belongs to user
    const existingTemplate = await prisma.incomeTemplate.findFirst({
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
        where: { id: categoryId, userId, type: "income" },
      });
      if (!category) {
        return {
          success: false,
          error: "Invalid category or category is not income type",
        };
      }
    }

    await prisma.incomeTemplate.update({
      where: { id },
      data: {
        name,
        accountId,
        categoryId,
        amount,
        description,
      },
    });

    revalidatePath("/incomes/templates");
    revalidatePath(`/incomes/templates/${id}/edit`);
    revalidatePath("/incomes");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in updateIncomeTemplate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteIncomeTemplate(id: string): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    // Verify template belongs to user
    const existingTemplate = await prisma.incomeTemplate.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return { success: false, error: "Template not found" };
    }

    await prisma.incomeTemplate.delete({
      where: { id },
    });

    revalidatePath("/incomes/templates");
    revalidatePath("/incomes");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in deleteIncomeTemplate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function duplicateIncomeTemplate(id: string): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    // Get original template
    const original = await prisma.incomeTemplate.findFirst({
      where: { id, userId },
    });

    if (!original) {
      return { success: false, error: "Template not found" };
    }

    // Create duplicate with " (Copy)" appended to name
    await prisma.incomeTemplate.create({
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

    revalidatePath("/incomes/templates");
    revalidatePath("/incomes");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in duplicateIncomeTemplate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function setDefaultIncomeTemplate(
  id: string | null
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    // If id is null, just unset current default
    if (id === null) {
      await prisma.incomeTemplate.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      revalidatePath("/incomes/templates");
      revalidatePath("/incomes");
      return { success: true };
    }

    // Verify template belongs to user
    const template = await prisma.incomeTemplate.findFirst({
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
      prisma.incomeTemplate.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      // Set new default
      prisma.incomeTemplate.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    revalidatePath("/incomes/templates");
    revalidatePath("/incomes");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in setDefaultIncomeTemplate:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
