import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { incomeTemplateServerSchema } from "@/features/income-templates/schemas";

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

    await prisma.incomeTemplate.create({
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
    console.error("Error in createIncomeTemplate:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
