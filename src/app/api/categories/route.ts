import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getCategories, getCategoriesByType } from "@/features/categories/queries";
import { categorySchema } from "@/features/categories/schemas";

export async function GET(request: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "income" | "expense" | null;

    let categories;
    if (type === "income" || type === "expense") {
      categories = await getCategoriesByType(type);
    } else {
      categories = await getCategories();
    }

    return NextResponse.json(categories);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const formData = await request.formData();

    const rawData = {
      name: formData.get("name"),
      type: formData.get("type"),
    };

    const validationResult = categorySchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, type } = validationResult.data;

    const category = await prisma.category.create({
      data: {
        userId,
        name,
        type,
      },
    });

    revalidatePath("/categories");

    return NextResponse.json({
      success: true,
      data: { id: category.id, name: category.name },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in createCategory:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
