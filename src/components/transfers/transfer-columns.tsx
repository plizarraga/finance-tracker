"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { TransferWithRelations } from "@/features/transfers/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { DataTableColumnHeader } from "@/components/shared/data-table-column-header";
import { Button } from "@/components/ui/button";

export const transferColumns: ColumnDef<TransferWithRelations>[] = [
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
    accessorKey: "fromAccount",
    id: "fromAccount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="From" />
    ),
    cell: ({ row }) => row.original.fromAccount.name,
    enableSorting: true,
  },
  {
    id: "arrow",
    header: "",
    cell: () => <ArrowRight className="h-4 w-4 text-muted-foreground" />,
    enableSorting: false,
    size: 48,
  },
  {
    accessorKey: "toAccount",
    id: "toAccount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="To" />
    ),
    cell: ({ row }) => row.original.toAccount.name,
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
      <div className="text-right font-medium">
        {formatCurrency(row.original.amount as unknown as number)}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Description"
        className="hidden md:flex"
      />
    ),
    cell: ({ row }) => (
      <div className="hidden max-w-[200px] truncate md:table-cell">
        {row.original.description || "-"}
      </div>
    ),
    enableSorting: true,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/transfers/${row.original.id}/edit`}>Edit</Link>
      </Button>
    ),
    enableSorting: false,
    size: 80,
  },
];
