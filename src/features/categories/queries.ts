import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import type { Category } from "@prisma/client";

export async function getCategories(): Promise<Category[]> {
  try {
    const { userId } = await requireAuth();
    return await prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getCategoriesByType(
  type: "income" | "expense"
): Promise<Category[]> {
  try {
    const { userId } = await requireAuth();
    return await prisma.category.findMany({
      where: {
        userId,
        type,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching categories by type:", error);
    return [];
  }
}

export async function getCategoryById(
  id: string
): Promise<Category | null> {
  try {
    const { userId } = await requireAuth();
    return await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching category:", error);
    return null;
  }
}
