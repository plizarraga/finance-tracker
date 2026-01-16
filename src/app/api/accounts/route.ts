import { NextResponse } from "next/server";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getAccounts } from "@/features/accounts/queries";

export async function GET() {
  try {
    await requireAuth();
    const accounts = await getAccounts();

    return NextResponse.json(accounts);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
