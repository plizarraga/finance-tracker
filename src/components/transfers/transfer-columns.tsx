"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { type TransferWithRelations } from "@/features/transfers/queries";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/shared/data-table-column-header";
import {
  createDateColumn,
  createAmountColumn,
  createRelationColumn,
} from "@/components/shared/column-helpers";

export const transferColumns: ColumnDef<TransferWithRelations>[] = [
  createDateColumn<TransferWithRelations>(),
  createRelationColumn<TransferWithRelations>(
    "fromAccount",
    "From",
    (row) => row.fromAccount.name
  ),
  {
    id: "arrow",
    header: "",
    cell: () => <ArrowRight className="h-4 w-4 text-muted-foreground" />,
    enableSorting: false,
    size: 48,
  },
  createRelationColumn<TransferWithRelations>("toAccount", "To", (row) => row.toAccount.name),
  createAmountColumn<TransferWithRelations>("neutral"),
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" className="hidden md:flex" />
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
