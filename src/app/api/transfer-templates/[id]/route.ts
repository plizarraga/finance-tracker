import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { transferTemplateServerSchema } from "@/features/transfer-templates/schemas";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const formData = await request.formData();

    const existingTemplate = await prisma.transferTemplate.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

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

    await prisma.transferTemplate.update({
      where: { id },
      data: {
        name: validatedData.name,
        fromAccountId: validatedData.fromAccountId,
        toAccountId: validatedData.toAccountId,
        amount: validatedData.amount,
        description: validatedData.description,
      },
    });

    revalidatePath("/transfers");
    revalidatePath(`/transfers/templates/${id}/edit`);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error updating transfer template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update template" },
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

    const template = await prisma.transferTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    await prisma.transferTemplate.delete({
      where: { id },
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
    console.error("Error deleting transfer template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
