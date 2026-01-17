import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { expenseServerSchema } from "@/features/expenses/schemas";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const formData = await request.formData();

    const rawData = {
      accountId: formData.get("accountId"),
      categoryId: formData.get("categoryId"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      description: formData.get("description"),
      notes: formData.get("notes") || null,
    };

    const validationResult = expenseServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return NextResponse.json(
        { success: false, error: errors },
        { status: 400 }
      );
    }

    const { accountId, categoryId, amount, date, description, notes } =
      validationResult.data;

    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Invalid account" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
        type: "expense",
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid category or category is not expense type",
        },
        { status: 400 }
      );
    }

    await prisma.expense.create({
      data: {
        userId,
        accountId,
        categoryId,
        amount,
        date,
        description,
        notes,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/accounts");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in createExpense:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
