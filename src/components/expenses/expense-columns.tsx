"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ExpenseWithRelations } from "@/features/expenses/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { DataTableColumnHeader } from "@/components/shared/data-table-column-header";

export const expenseColumns: ColumnDef<ExpenseWithRelations>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{formatDate(row.original.date)}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/expenses/${row.original.id}/edit`}
        className="hover:underline"
      >
        {row.original.description || "-"}
      </Link>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "category",
    id: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => row.original.category.name,
    enableSorting: true,
  },
  {
    accessorKey: "account",
    id: "account",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Account" />
    ),
    cell: ({ row }) => row.original.account.name,
    enableSorting: true,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Amount"
        className="justify-end"
      />
    ),
    cell: ({ row }) => (
      <div className="text-right text-red-600 dark:text-red-400 font-medium">
        -{formatCurrency(row.original.amount as unknown as number)}
      </div>
    ),
    enableSorting: true,
  },
];
