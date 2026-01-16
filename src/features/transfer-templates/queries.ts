import { prisma } from "@/lib/auth";
import { requireAuth } from "@/lib/prisma-helpers";
import type { TransferTemplate, Account } from "@prisma/client";

// Prisma type with relations (before serialization)
type TransferTemplateWithRelationsPrisma = TransferTemplate & {
  fromAccount: Account | null;
  toAccount: Account | null;
};

// Serialized version for Client Components (Decimal -> number)
export type TransferTemplateWithRelations = Omit<
  TransferTemplateWithRelationsPrisma,
  "amount"
> & {
  amount: number | null;
};

function serializeTemplate(
  template: TransferTemplateWithRelationsPrisma
): TransferTemplateWithRelations {
  return {
    ...template,
    amount: template.amount ? template.amount.toNumber() : null,
  };
}

export async function getTransferTemplates(): Promise<
  TransferTemplateWithRelations[]
> {
  const { userId } = await requireAuth();

  const templates = await prisma.transferTemplate.findMany({
    where: { userId },
    include: {
      fromAccount: true,
      toAccount: true,
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return templates.map(serializeTemplate);
}

export async function getDefaultTransferTemplate(): Promise<TransferTemplateWithRelations | null> {
  const { userId } = await requireAuth();

  const template = await prisma.transferTemplate.findFirst({
    where: { userId, isDefault: true },
    include: {
      fromAccount: true,
      toAccount: true,
    },
  });

  return template ? serializeTemplate(template) : null;
}

export async function getTransferTemplateById(
  id: string
): Promise<TransferTemplateWithRelations | null> {
  const { userId } = await requireAuth();

  const template = await prisma.transferTemplate.findFirst({
    where: { id, userId },
    include: {
      fromAccount: true,
      toAccount: true,
    },
  });

  return template ? serializeTemplate(template) : null;
}
