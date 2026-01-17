"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { type TransferWithRelations } from "@/features/transfers/queries";
import { DataTableColumnHeader } from "@/components/shared/data-table-column-header";
import { createAmountColumn } from "@/components/shared/column-helpers";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export const transferColumns: ColumnDef<TransferWithRelations>[] = [
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => (
      <Link
        href={`/transfers/${row.original.id}/edit`}
        className="max-w-[200px] truncate hover:underline"
      >
        {row.original.description || "-"}
      </Link>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "fromAccount",
    id: "fromAccount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="From" className="hidden md:flex" />
    ),
    cell: ({ row }) => (
      <div className="hidden md:table-cell">{row.original.fromAccount.name}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "toAccount",
    id: "toAccount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="To" className="hidden md:flex" />
    ),
    cell: ({ row }) => (
      <div className="hidden md:table-cell">{row.original.toAccount.name}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" className="hidden md:flex" />
    ),
    cell: ({ row }) => (
      <div className="hidden md:table-cell">
        {formatDate(row.original.date)}
      </div>
    ),
    enableSorting: true,
  },
  createAmountColumn<TransferWithRelations>("neutral"),
];
