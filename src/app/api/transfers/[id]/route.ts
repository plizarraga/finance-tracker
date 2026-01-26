import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getTransferById } from "@/features/transfers/queries";
import { transferServerSchema } from "@/features/transfers/schemas";
import { calculateAccountBalance } from "@/features/accounts/queries";
import { normalizeDescription } from "@/lib/normalize";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;

    const transfer = await getTransferById(id);

    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    return NextResponse.json(transfer);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching transfer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const formData = await request.formData();

    const rawData = {
      fromAccountId: formData.get("fromAccountId"),
      toAccountId: formData.get("toAccountId"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      description: formData.get("description"),
      notes: formData.get("notes") || null,
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

    const { fromAccountId, toAccountId, amount, date, description, notes } =
      validationResult.data;

    const existingTransfer = await prisma.transfer.findFirst({
      where: { id, userId },
    });

    if (!existingTransfer) {
      return NextResponse.json(
        { success: false, error: "Transfer not found" },
        { status: 404 }
      );
    }

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

    // Balance validation for updates
    // Add back old transfer if same source account (reverses the old transaction)
    const oldAmount =
      existingTransfer.fromAccountId === fromAccountId
        ? existingTransfer.amount.toNumber()
        : 0;

    const fromAccount = accounts.find((a) => a.id === fromAccountId)!;
    const currentBalance = await calculateAccountBalance(fromAccount.id);
    const effectiveBalance = currentBalance + oldAmount;

    if (effectiveBalance < amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient funds. Available: $${effectiveBalance.toFixed(2)}, Required: $${amount.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    await prisma.transfer.update({
      where: { id },
      data: {
        fromAccountId,
        toAccountId,
        amount,
        date,
        description,
        descriptionNormalized: normalizeDescription(description),
        notes,
      },
    });

    revalidatePath("/transfers");
    revalidatePath("/accounts");
    revalidatePath(`/transfers/${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in updateTransfer:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const existingTransfer = await prisma.transfer.findFirst({
      where: { id, userId },
    });

    if (!existingTransfer) {
      return NextResponse.json(
        { success: false, error: "Transfer not found" },
        { status: 404 }
      );
    }

    await prisma.transfer.delete({
      where: { id },
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
    console.error("Error in deleteTransfer:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
