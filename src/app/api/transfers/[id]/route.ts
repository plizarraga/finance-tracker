import { NextResponse } from "next/server";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getTransferById } from "@/features/transfers/queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;

    const transfer = await getTransferById(id);

    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    return NextResponse.json(transfer);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching transfer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
