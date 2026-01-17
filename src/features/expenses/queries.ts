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
  description?: string;
  amountMin?: number;
  amountMax?: number;
  page?: number;
  pageSize?: number;
  sortBy?: "date" | "description" | "amount" | "category" | "account";
  sortOrder?: "asc" | "desc";
}

export async function getExpenses(
  filters?: ExpenseFilters
): Promise<ExpenseWithRelations[]> {
  try {
    const { userId } = await requireAuth();

    // Pagination
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const skip = (page - 1) * pageSize;

    // Sorting
    const sortBy = filters?.sortBy || "date";
    const sortOrder = filters?.sortOrder || "desc";

    let orderBy: Prisma.ExpenseOrderByWithRelationInput;
    if (sortBy === "category") {
      orderBy = { category: { name: sortOrder } };
    } else if (sortBy === "account") {
      orderBy = { account: { name: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    return await prisma.expense.findMany({
      where: {
        userId,
        ...(filters?.accountId && { accountId: filters.accountId }),
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.description && {
          description: { contains: filters.description, mode: "insensitive" },
        }),
        ...(filters?.dateRange && {
          date: {
            gte: filters.dateRange.from,
            lte: filters.dateRange.to,
          },
        }),
        ...(filters?.amountMin !== undefined ||
        filters?.amountMax !== undefined
          ? {
              amount: {
                ...(filters?.amountMin !== undefined && {
                  gte: filters.amountMin,
                }),
                ...(filters?.amountMax !== undefined && {
                  lte: filters.amountMax,
                }),
              },
            }
          : {}),
      },
      include: {
        account: true,
        category: true,
      },
      orderBy,
      skip,
      take: pageSize,
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

export async function getExpensesCount(
  filters?: Omit<ExpenseFilters, "page" | "pageSize" | "sortBy" | "sortOrder">
): Promise<number> {
  try {
    const { userId } = await requireAuth();
    return await prisma.expense.count({
      where: {
        userId,
        ...(filters?.accountId && { accountId: filters.accountId }),
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.description && {
          description: { contains: filters.description, mode: "insensitive" },
        }),
        ...(filters?.dateRange && {
          date: {
            gte: filters.dateRange.from,
            lte: filters.dateRange.to,
          },
        }),
        ...(filters?.amountMin !== undefined ||
        filters?.amountMax !== undefined
          ? {
              amount: {
                ...(filters?.amountMin !== undefined && {
                  gte: filters.amountMin,
                }),
                ...(filters?.amountMax !== undefined && {
                  lte: filters.amountMax,
                }),
              },
            }
          : {}),
      },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error counting expenses:", error);
    return 0;
  }
}
