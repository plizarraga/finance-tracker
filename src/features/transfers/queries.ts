import { prisma } from "@/lib/auth";
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
  userId: string,
  filters?: TransferFilters
): Promise<TransferWithRelations[]> {
  try {
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
    console.error("Error fetching transfers:", error);
    return [];
  }
}

export async function getTransferById(
  id: string,
  userId: string
): Promise<TransferWithRelations | null> {
  try {
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
    console.error("Error fetching transfer:", error);
    return null;
  }
}
