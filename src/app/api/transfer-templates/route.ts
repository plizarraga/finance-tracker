import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { transferTemplateServerSchema } from "@/features/transfer-templates/schemas";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const formData = await request.formData();

    const rawData = {
      name: formData.get("name"),
      fromAccountId: formData.get("fromAccountId") || null,
      toAccountId: formData.get("toAccountId") || null,
      amount: formData.get("amount") || null,
      description: formData.get("description") || null,
    };

    const validationResult = transferTemplateServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return NextResponse.json(
        { success: false, error: errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    if (validatedData.fromAccountId) {
      const fromAccount = await prisma.account.findFirst({
        where: { id: validatedData.fromAccountId, userId },
      });
      if (!fromAccount) {
        return NextResponse.json(
          { success: false, error: "Invalid from account" },
          { status: 400 }
        );
      }
    }

    if (validatedData.toAccountId) {
      const toAccount = await prisma.account.findFirst({
        where: { id: validatedData.toAccountId, userId },
      });
      if (!toAccount) {
        return NextResponse.json(
          { success: false, error: "Invalid to account" },
          { status: 400 }
        );
      }
    }

    await prisma.transferTemplate.create({
      data: {
        userId,
        name: validatedData.name,
        fromAccountId: validatedData.fromAccountId,
        toAccountId: validatedData.toAccountId,
        amount: validatedData.amount,
        description: validatedData.description,
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
    console.error("Error creating transfer template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create template" },
      { status: 500 }
    );
  }
}
