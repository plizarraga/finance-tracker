import { NextResponse } from "next/server";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getCategories, getCategoriesByType } from "@/features/categories/queries";

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
