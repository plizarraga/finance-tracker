import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json().catch(() => null);
    const id = body?.id ?? null;

    if (id === null) {
      await prisma.transferTemplate.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
      revalidatePath("/transfers");
      return NextResponse.json({ success: true });
    }

    if (typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid template id" },
        { status: 400 }
      );
    }

    const template = await prisma.transferTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    if (template.isDefault) {
      return NextResponse.json({ success: true });
    }

    await prisma.$transaction([
      prisma.transferTemplate.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.transferTemplate.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    revalidatePath("/transfers");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error setting default transfer template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to set default template" },
      { status: 500 }
    );
  }
}
