import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { transferServerSchema } from "@/features/transfers/schemas";
import { calculateAccountBalance } from "@/features/accounts/queries";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const formData = await request.formData();

    const rawData = {
      fromAccountId: formData.get("fromAccountId"),
      toAccountId: formData.get("toAccountId"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      description: formData.get("description") || null,
    };

    const validationResult = transferServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return NextResponse.json(
        { success: false, error: errors },
        { status: 400 }
      );
    }

    const { fromAccountId, toAccountId, amount, date, description } =
      validationResult.data;

    const accounts = await prisma.account.findMany({
      where: {
        userId,
        id: { in: [fromAccountId, toAccountId] },
      },
    });

    if (accounts.length !== 2) {
      return NextResponse.json(
        { success: false, error: "Invalid account selection" },
        { status: 400 }
      );
    }

    // Balance validation - MUST have sufficient funds
    const fromAccount = accounts.find((a) => a.id === fromAccountId)!;
    const balance = await calculateAccountBalance(fromAccount.id);

    if (balance < amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient funds. Available: $${balance.toFixed(2)}, Required: $${amount.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    await prisma.transfer.create({
      data: {
        userId,
        fromAccountId,
        toAccountId,
        amount,
        date,
        description,
      },
    });

    revalidatePath("/transfers");
    revalidatePath("/accounts");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in createTransfer:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
