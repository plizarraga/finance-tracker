import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import type { Prisma } from "@prisma/client";
import type { DateRange } from "@/types";

// Type for Transfer with both accounts loaded
export type TransferWithRelations = Prisma.TransferGetPayload<{
  include: { fromAccount: true; toAccount: true };
}>;

interface TransferFilters {
  dateRange?: DateRange;
  accountId?: string;
}

export async function getTransfers(
  filters?: TransferFilters
): Promise<TransferWithRelations[]> {
  try {
    const { userId } = await requireAuth();
    return await prisma.transfer.findMany({
      where: {
        userId,
        ...(filters?.accountId && {
          OR: [
            { fromAccountId: filters.accountId },
            { toAccountId: filters.accountId },
          ],
        }),
        ...(filters?.dateRange && {
          date: {
            gte: filters.dateRange.from,
            lte: filters.dateRange.to,
          },
        }),
      },
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: { date: "desc" },
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
