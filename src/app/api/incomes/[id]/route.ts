import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getIncomeById } from "@/features/incomes/queries";
import { incomeServerSchema } from "@/features/incomes/schemas";
import { normalizeDescription } from "@/lib/normalize";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;

    const income = await getIncomeById(id);

    if (!income) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    return NextResponse.json(income);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching income:", error);
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
      accountId: formData.get("accountId"),
      categoryId: formData.get("categoryId"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      description: formData.get("description"),
      notes: formData.get("notes") || null,
    };

    const validationResult = incomeServerSchema.safeParse(rawData);

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

    const existingIncome = await prisma.income.findFirst({
      where: { id, userId },
    });

    if (!existingIncome) {
      return NextResponse.json(
        { success: false, error: "Income not found" },
        { status: 404 }
      );
    }

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
        type: "income",
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid category or category is not income type",
        },
        { status: 400 }
      );
    }

    await prisma.income.update({
      where: { id },
      data: {
        accountId,
        categoryId,
        amount,
        date,
        description,
        descriptionNormalized: normalizeDescription(description),
        notes,
      },
    });

    revalidatePath("/incomes");
    revalidatePath(`/incomes/${id}`);
    revalidatePath("/accounts");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in updateIncome:", error);
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

    const existingIncome = await prisma.income.findFirst({
      where: { id, userId },
    });

    if (!existingIncome) {
      return NextResponse.json(
        { success: false, error: "Income not found" },
        { status: 404 }
      );
    }

    await prisma.income.delete({
      where: { id },
    });

    revalidatePath("/incomes");
    revalidatePath("/accounts");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in deleteIncome:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
