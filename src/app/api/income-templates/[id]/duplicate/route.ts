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

    const original = await prisma.incomeTemplate.findFirst({
      where: { id, userId },
    });

    if (!original) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    await prisma.incomeTemplate.create({
      data: {
        userId,
        name: `${original.name} (Copy)`,
        accountId: original.accountId,
        categoryId: original.categoryId,
        amount: original.amount,
        description: original.description,
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
    console.error("Error in duplicateIncomeTemplate:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
