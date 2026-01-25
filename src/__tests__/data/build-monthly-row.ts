import { Prisma } from "@prisma/client";

export type MonthlyRow = {
  month: string;
  total: Prisma.Decimal | null;
};

export function buildMonthlyRow(
  overrides: Partial<MonthlyRow> = {}
): MonthlyRow {
  const base: MonthlyRow = {
    month: "2024-02",
    total: new Prisma.Decimal(100),
  };
  return { ...base, ...overrides };
}
