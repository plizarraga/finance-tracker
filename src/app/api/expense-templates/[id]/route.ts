import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { expenseTemplateServerSchema } from "@/features/expense-templates/schemas";

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

    const validationResult = expenseTemplateServerSchema.safeParse(rawData);

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

    const existingTemplate = await prisma.expenseTemplate.findFirst({
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
        where: { id: categoryId, userId, type: "expense" },
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
    }

    await prisma.expenseTemplate.update({
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

    revalidatePath("/expenses/templates");
    revalidatePath(`/expenses/templates/${id}/edit`);
    revalidatePath("/expenses");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in updateExpenseTemplate:", error);
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

    const existingTemplate = await prisma.expenseTemplate.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    await prisma.expenseTemplate.delete({
      where: { id },
    });

    revalidatePath("/expenses/templates");
    revalidatePath("/expenses");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in deleteExpenseTemplate:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
