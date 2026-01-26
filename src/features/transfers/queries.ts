import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import type { Prisma } from "@prisma/client";
import type { DateRange } from "@/types";
import { normalizeDescription } from "@/lib/normalize";

// Type for Transfer with both accounts loaded
export type TransferWithRelations = Prisma.TransferGetPayload<{
  include: { fromAccount: true; toAccount: true };
}>;

interface TransferFilters {
  dateRange?: DateRange;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  description?: string;
  amountMin?: number;
  amountMax?: number;
  page?: number;
  pageSize?: number;
  sortBy?: "date" | "description" | "amount" | "fromAccount" | "toAccount";
  sortOrder?: "asc" | "desc";
}

export async function getTransfers(
  filters?: TransferFilters
): Promise<TransferWithRelations[]> {
  try {
    const { userId } = await requireAuth();
    const normalizedDescription = filters?.description
      ? normalizeDescription(filters.description)
      : "";

    // Pagination
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const skip = (page - 1) * pageSize;

    // Sorting
    const sortBy = filters?.sortBy || "date";
    const sortOrder = filters?.sortOrder || "desc";

    let orderBy: Prisma.TransferOrderByWithRelationInput;
    if (sortBy === "fromAccount") {
      orderBy = { fromAccount: { name: sortOrder } };
    } else if (sortBy === "toAccount") {
      orderBy = { toAccount: { name: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    return await prisma.transfer.findMany({
      where: {
        userId,
        ...(filters?.accountId && {
          OR: [
            { fromAccountId: filters.accountId },
            { toAccountId: filters.accountId },
          ],
        }),
        ...(filters?.fromAccountId && { fromAccountId: filters.fromAccountId }),
        ...(filters?.toAccountId && { toAccountId: filters.toAccountId }),
        ...(normalizedDescription && {
          descriptionNormalized: {
            contains: normalizedDescription,
            mode: "insensitive",
          },
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
        fromAccount: true,
        toAccount: true,
      },
      orderBy,
      skip,
      take: pageSize,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching transfers:", error);
    return [];
  }
}

export async function getTransferById(
  id: string
): Promise<TransferWithRelations | null> {
  try {
    const { userId } = await requireAuth();
    return await prisma.transfer.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching transfer:", error);
    return null;
  }
}

export async function getTransfersCount(
  filters?: Omit<TransferFilters, "page" | "pageSize" | "sortBy" | "sortOrder">
): Promise<number> {
  try {
    const { userId } = await requireAuth();
    const normalizedDescription = filters?.description
      ? normalizeDescription(filters.description)
      : "";
    return await prisma.transfer.count({
      where: {
        userId,
        ...(filters?.accountId && {
          OR: [
            { fromAccountId: filters.accountId },
            { toAccountId: filters.accountId },
          ],
        }),
        ...(filters?.fromAccountId && { fromAccountId: filters.fromAccountId }),
        ...(filters?.toAccountId && { toAccountId: filters.toAccountId }),
        ...(normalizedDescription && {
          descriptionNormalized: {
            contains: normalizedDescription,
            mode: "insensitive",
          },
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
    console.error("Error counting transfers:", error);
    return 0;
  }
}
