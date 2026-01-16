import { prisma } from "@/lib/auth";
import type { Category } from "@prisma/client";

export async function getCategories(userId: string): Promise<Category[]> {
  try {
    return await prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getCategoriesByType(
  userId: string,
  type: "income" | "expense"
): Promise<Category[]> {
  try {
    return await prisma.category.findMany({
      where: {
        userId,
        type,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching categories by type:", error);
    return [];
  }
}

export async function getCategoryById(
  id: string,
  userId: string
): Promise<Category | null> {
  try {
    return await prisma.category.findUnique({
      where: {
        id,
      },
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}
