import { prisma } from "@/lib/auth";
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
  userId: string,
  filters?: IncomeFilters
): Promise<IncomeWithRelations[]> {
  try {
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
    console.error("Error fetching incomes:", error);
    return [];
  }
}

export async function getIncomeById(
  id: string,
  userId: string
): Promise<IncomeWithRelations | null> {
  try {
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
    console.error("Error fetching income:", error);
    return null;
  }
}
