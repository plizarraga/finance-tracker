import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { expenseTemplateServerSchema } from "@/features/expense-templates/schemas";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
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

    await prisma.expenseTemplate.create({
      data: {
        userId,
        name,
        accountId,
        categoryId,
        amount,
        description,
        notes,
        isDefault: false,
      },
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
    console.error("Error in createExpenseTemplate:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
