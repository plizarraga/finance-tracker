import { NextResponse } from "next/server";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getIncomeById } from "@/features/incomes/queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;

    const income = await getIncomeById(id);

    if (!income) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    return NextResponse.json(income);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching income:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
