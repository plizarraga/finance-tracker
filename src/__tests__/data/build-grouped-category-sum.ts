import { Prisma } from "@prisma/client";

export type GroupedCategorySum = {
  categoryId: string;
  _sum: { amount: Prisma.Decimal | null };
};

export function buildGroupedCategorySum(
  overrides: Partial<GroupedCategorySum> = {}
): GroupedCategorySum {
  const base: GroupedCategorySum = {
    categoryId: "category-102",
    _sum: { amount: new Prisma.Decimal(75) },
  };
  return {
    ...base,
    ...overrides,
    _sum: { ...base._sum, ...overrides._sum },
  };
}
