import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { incomeTemplateServerSchema } from "@/features/income-templates/schemas";

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
      accountId: formData.get("accountId") || null,
      categoryId: formData.get("categoryId") || null,
      amount: formData.get("amount") || null,
      description: formData.get("description"),
      notes: formData.get("notes") || null,
    };

    const validationResult = incomeTemplateServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return NextResponse.json(
        { success: false, error: errors },
        { status: 400 }
      );
    }

    const { name, accountId, categoryId, amount, description, notes } =
      validationResult.data;

    const existingTemplate = await prisma.incomeTemplate.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId },
      });
      if (!account) {
        return NextResponse.json(
          { success: false, error: "Invalid account" },
          { status: 400 }
        );
      }
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId, type: "income" },
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
    }

    await prisma.incomeTemplate.update({
      where: { id },
      data: {
        name,
        accountId,
        categoryId,
        amount,
        description,
        notes,
      },
    });

    revalidatePath("/incomes/templates");
    revalidatePath(`/incomes/templates/${id}/edit`);
    revalidatePath("/incomes");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in updateIncomeTemplate:", error);
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

    const existingTemplate = await prisma.incomeTemplate.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    await prisma.incomeTemplate.delete({
      where: { id },
    });

    revalidatePath("/incomes/templates");
    revalidatePath("/incomes");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in deleteIncomeTemplate:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
