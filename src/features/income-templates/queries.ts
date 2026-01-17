import { prisma } from "@/lib/auth";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { serializeAccount, type AccountSerialized } from "@/features/templates/serialize";
import type { Prisma } from "@prisma/client";

// Type for IncomeTemplate with relations
type IncomeTemplateWithRelationsPrisma = Prisma.IncomeTemplateGetPayload<{
  include: { account: true; category: true };
}>;

// Serialized version for Client Components (Decimal -> number)
export type IncomeTemplateWithRelations = Omit<
  IncomeTemplateWithRelationsPrisma,
  "amount" | "account"
> & {
  amount: number | null;
  account: AccountSerialized | null;
};

// Helper to serialize Decimal to number
function serializeTemplate(
  template: IncomeTemplateWithRelationsPrisma
): IncomeTemplateWithRelations {
  return {
    ...template,
    amount: template.amount ? template.amount.toNumber() : null,
    account: serializeAccount(template.account),
  };
}

export async function getIncomeTemplates(): Promise<IncomeTemplateWithRelations[]> {
  try {
    const { userId } = await requireAuth();
    const templates = await prisma.incomeTemplate.findMany({
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
    console.error("Error fetching income templates:", error);
    return [];
  }
}

export async function getDefaultIncomeTemplate(): Promise<IncomeTemplateWithRelations | null> {
  try {
    const { userId } = await requireAuth();
    const template = await prisma.incomeTemplate.findFirst({
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
    console.error("Error fetching default income template:", error);
    return null;
  }
}

export async function getIncomeTemplateById(
  id: string
): Promise<IncomeTemplateWithRelations | null> {
  try {
    const { userId } = await requireAuth();
    const template = await prisma.incomeTemplate.findFirst({
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
    console.error("Error fetching income template:", error);
    return null;
  }
}
