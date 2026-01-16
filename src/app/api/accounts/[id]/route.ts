import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getAccountsWithBalances } from "@/features/accounts/queries";
import { accountSchema } from "@/features/accounts/schemas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;

    // Get all accounts with balances and find the specific one
    const accounts = await getAccountsWithBalances();
    const account = accounts.find((acc) => acc.id === id);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching account:", error);
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
      name: formData.get("name"),
      description: formData.get("description") || null,
    };

    const validationResult = accountSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return NextResponse.json(
        { success: false, error: errors },
        { status: 400 }
      );
    }

    const { name, description } = validationResult.data;

    const existingAccount = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 }
      );
    }

    await prisma.account.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    revalidatePath("/accounts");
    revalidatePath(`/accounts/${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in updateAccount:", error);
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

    const existingAccount = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 }
      );
    }

    const [incomesCount, expensesCount, transfersFromCount, transfersToCount] =
      await Promise.all([
        prisma.income.count({ where: { accountId: id } }),
        prisma.expense.count({ where: { accountId: id } }),
        prisma.transfer.count({ where: { fromAccountId: id } }),
        prisma.transfer.count({ where: { toAccountId: id } }),
      ]);

    if (
      incomesCount > 0 ||
      expensesCount > 0 ||
      transfersFromCount > 0 ||
      transfersToCount > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete account with existing transactions. Please delete all transactions first.",
        },
        { status: 400 }
      );
    }

    await prisma.account.delete({
      where: { id },
    });

    revalidatePath("/accounts");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in deleteAccount:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
