import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import type { Prisma } from "@prisma/client";
import type { DateRange } from "@/types";

// Type for Expense with relations loaded
export type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: { account: true; category: true };
}>;

interface ExpenseFilters {
  dateRange?: DateRange;
  accountId?: string;
  categoryId?: string;
}

export async function getExpenses(
  filters?: ExpenseFilters
): Promise<ExpenseWithRelations[]> {
  try {
    const { userId } = await requireAuth();
    return await prisma.expense.findMany({
      where: {
        userId,
        ...(filters?.accountId && { accountId: filters.accountId }),
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.dateRange && {
          date: {
            gte: filters.dateRange.from,
            lte: filters.dateRange.to,
          },
        }),
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: "desc" },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching expenses:", error);
    return [];
  }
}

export async function getExpenseById(
  id: string
): Promise<ExpenseWithRelations | null> {
  try {
    const { userId } = await requireAuth();
    return await prisma.expense.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        account: true,
        category: true,
      },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching expense:", error);
    return null;
  }
}
