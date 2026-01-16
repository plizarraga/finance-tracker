import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import type { Prisma } from "@prisma/client";
import type { DateRange } from "@/types";

// Type for Income with relations loaded
export type IncomeWithRelations = Prisma.IncomeGetPayload<{
  include: { account: true; category: true };
}>;

interface IncomeFilters {
  dateRange?: DateRange;
  accountId?: string;
  categoryId?: string;
}

export async function getIncomes(
  filters?: IncomeFilters
): Promise<IncomeWithRelations[]> {
  try {
    const { userId } = await requireAuth();
    return await prisma.income.findMany({
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
    console.error("Error fetching incomes:", error);
    return [];
  }
}

export async function getIncomeById(
  id: string
): Promise<IncomeWithRelations | null> {
  try {
    const { userId } = await requireAuth();
    return await prisma.income.findFirst({
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
    console.error("Error fetching income:", error);
    return null;
  }
}
