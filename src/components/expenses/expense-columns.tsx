"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { type ExpenseWithRelations } from "@/features/expenses/queries";
import {
  createDateColumn,
  createDescriptionColumn,
  createAmountColumn,
  createRelationColumn,
} from "@/components/shared/column-helpers";

export const expenseColumns: ColumnDef<ExpenseWithRelations>[] = [
  createDateColumn<ExpenseWithRelations>(),
  createDescriptionColumn<ExpenseWithRelations>("/expenses"),
  createRelationColumn<ExpenseWithRelations>("category", "Category", (row) => row.category.name),
  createRelationColumn<ExpenseWithRelations>("account", "Account", (row) => row.account.name),
  createAmountColumn<ExpenseWithRelations>("negative", "-"),
];
