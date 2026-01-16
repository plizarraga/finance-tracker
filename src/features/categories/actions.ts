"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import type { ActionResult } from "@/types";
import { categorySchema } from "./schemas";

export async function createCategory(
  formData: FormData
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const { userId } = await requireAuth();

    const rawData = {
      name: formData.get("name"),
      type: formData.get("type"),
    };

    const validationResult = categorySchema.safeParse(rawData);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      };
    }

    const { name, type } = validationResult.data;

    const category = await prisma.category.create({
      data: {
        userId,
        name,
        type,
      },
    });

    revalidatePath("/categories");

    return { success: true, data: { id: category.id, name: category.name } };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in createCategory:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    const rawData = {
      name: formData.get("name"),
      type: formData.get("type"),
    };

    const validationResult = categorySchema.safeParse(rawData);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      };
    }

    const { name, type } = validationResult.data;

    // Verificar que la categoría pertenece al usuario
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existingCategory) {
      return { success: false, error: "Category not found" };
    }

    await prisma.category.update({
      where: { id },
      data: {
        name,
        type,
      },
    });

    revalidatePath("/categories");
    revalidatePath(`/categories/${id}/edit`);

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in updateCategory:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const { userId } = await requireAuth();

    // Verificar que la categoría pertenece al usuario
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existingCategory) {
      return { success: false, error: "Category not found" };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/categories");

    return { success: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Error in deleteCategory:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
