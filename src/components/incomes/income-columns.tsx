"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { type IncomeWithRelations } from "@/features/incomes/queries";
import {
  createDateColumn,
  createDescriptionColumn,
  createAmountColumn,
  createRelationColumn,
} from "@/components/shared/column-helpers";

export const incomeColumns: ColumnDef<IncomeWithRelations>[] = [
  createDescriptionColumn<IncomeWithRelations>("/incomes"),
  createRelationColumn<IncomeWithRelations>("category", "Category", (row) => row.category.name),
  createRelationColumn<IncomeWithRelations>("account", "Account", (row) => row.account.name),
  createDateColumn<IncomeWithRelations>(),
  createAmountColumn<IncomeWithRelations>("positive"),
];
