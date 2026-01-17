import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getAccounts } from "@/features/accounts/queries";
import {
  accountServerSchema,
} from "@/features/accounts/schemas";

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

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const formData = await request.formData();

    const rawData = {
      name: formData.get("name"),
      description: formData.get("description") || null,
      initialBalance: formData.get("initialBalance") || "0",
    };

    const validationResult = accountServerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return NextResponse.json(
        { success: false, error: errors },
        { status: 400 }
      );
    }

    const { name, description, initialBalance } = validationResult.data;

    const account = await prisma.account.create({
      data: {
        userId,
        name,
        description,
        initialBalance,
      },
    });

    revalidatePath("/accounts");

    return NextResponse.json({
      success: true,
      data: { id: account.id, name: account.name },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error in createAccount:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
