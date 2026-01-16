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

    const template = await prisma.transferTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    await prisma.transferTemplate.create({
      data: {
        userId,
        name: `${template.name} (Copy)`,
        fromAccountId: template.fromAccountId,
        toAccountId: template.toAccountId,
        amount: template.amount,
        description: template.description,
        isDefault: false,
      },
    });

    revalidatePath("/transfers");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error duplicating transfer template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to duplicate template" },
      { status: 500 }
    );
  }
}
