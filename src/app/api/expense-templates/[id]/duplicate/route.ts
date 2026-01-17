import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const original = await prisma.expenseTemplate.findFirst({
      where: { id, userId },
    });

    if (!original) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    await prisma.expenseTemplate.create({
      data: {
        userId,
        name: `${original.name} (Copy)`,
        accountId: original.accountId,
        categoryId: original.categoryId,
        amount: original.amount,
        description: original.description,
        notes: null,
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
    console.error("Error in duplicateExpenseTemplate:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
