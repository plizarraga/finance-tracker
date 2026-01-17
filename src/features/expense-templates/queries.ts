import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { serializeAccount, type AccountSerialized } from "@/features/templates/serialize";
import type { Prisma } from "@prisma/client";

// Type for ExpenseTemplate with relations
type ExpenseTemplateWithRelationsPrisma = Prisma.ExpenseTemplateGetPayload<{
  include: { account: true; category: true };
}>;

// Serialized version for Client Components (Decimal -> number)
export type ExpenseTemplateWithRelations = Omit<
  ExpenseTemplateWithRelationsPrisma,
  "amount" | "account"
> & {
  amount: number | null;
  account: AccountSerialized | null;
};

// Helper to serialize Decimal to number
function serializeTemplate(
  template: ExpenseTemplateWithRelationsPrisma
): ExpenseTemplateWithRelations {
  return {
    ...template,
    amount: template.amount ? template.amount.toNumber() : null,
    account: serializeAccount(template.account),
  };
}

export async function getExpenseTemplates(): Promise<ExpenseTemplateWithRelations[]> {
  try {
    const { userId } = await requireAuth();
    const templates = await prisma.expenseTemplate.findMany({
      where: { userId },
      include: {
        account: true,
        category: true,
      },
      orderBy: [
        { isDefault: "desc" }, // Default template first
        { name: "asc" },       // Then alphabetically
      ],
    });
    return templates.map(serializeTemplate);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching expense templates:", error);
    return [];
  }
}

export async function getDefaultExpenseTemplate(): Promise<ExpenseTemplateWithRelations | null> {
  try {
    const { userId } = await requireAuth();
    const template = await prisma.expenseTemplate.findFirst({
      where: {
        userId,
        isDefault: true,
      },
      include: {
        account: true,
        category: true,
      },
    });
    return template ? serializeTemplate(template) : null;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching default expense template:", error);
    return null;
  }
}

export async function getExpenseTemplateById(
  id: string
): Promise<ExpenseTemplateWithRelations | null> {
  try {
    const { userId } = await requireAuth();
    const template = await prisma.expenseTemplate.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        account: true,
        category: true,
      },
    });
    return template ? serializeTemplate(template) : null;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }
    console.error("Error fetching expense template:", error);
    return null;
  }
}
