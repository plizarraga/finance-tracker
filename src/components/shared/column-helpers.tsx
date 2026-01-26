"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDateOnly } from "@/lib/format";
import { DataTableColumnHeader } from "./data-table-column-header";

type AmountVariant = "positive" | "negative" | "neutral";

const AMOUNT_STYLES: Record<AmountVariant, string> = {
  positive: "text-right text-green-600 dark:text-green-400 font-medium",
  negative: "text-right text-red-600 dark:text-red-400 font-medium",
  neutral: "text-right font-medium",
};

export function createDateColumn<TData extends { date: Date }>(): ColumnDef<TData> {
  return {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => <div className="font-medium">{formatDateOnly(row.original.date)}</div>,
    enableSorting: true,
  };
}

export function createDescriptionColumn<TData extends { id: string; description: string | null }>(
  basePath: string
): ColumnDef<TData> {
  return {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => (
      <Link href={`${basePath}/${row.original.id}/edit`} className="hover:underline">
        {row.original.description || "-"}
      </Link>
    ),
    enableSorting: true,
  };
}

export function createAmountColumn<TData extends { amount: unknown }>(
  variant: AmountVariant = "neutral",
  prefix = ""
): ColumnDef<TData> {
  return {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" className="justify-end" />
    ),
    cell: ({ row }) => (
      <div className={AMOUNT_STYLES[variant]}>
        {prefix}
        {formatCurrency(row.original.amount as number)}
      </div>
    ),
    enableSorting: true,
  };
}

export function createRelationColumn<TData>(
  accessorKey: string,
  title: string,
  getDisplayValue: (row: TData) => string
): ColumnDef<TData> {
  return {
    accessorKey,
    id: accessorKey,
    header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
    cell: ({ row }) => getDisplayValue(row.original),
    enableSorting: true,
  };
}
