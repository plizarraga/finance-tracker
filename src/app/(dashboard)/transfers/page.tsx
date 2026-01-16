import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeftRight, Plus, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTransfers } from "@/features/transfers/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TransfersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const transfers = await getTransfers(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transfers"
        description="Transfer money between your accounts"
        action={
          <Button asChild>
            <Link href="/transfers/new">
              <Plus className="mr-2 h-4 w-4" />
              New Transfer
            </Link>
          </Button>
        }
      />

      {transfers.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="h-8 w-8" />}
          title="No transfers yet"
          description="Create your first transfer to move money between accounts."
          action={
            <Button asChild>
              <Link href="/transfers/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Transfer
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden md:table-cell">
                  Description
                </TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">
                    {formatDate(transfer.date)}
                  </TableCell>
                  <TableCell>{transfer.fromAccount.name}</TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>{transfer.toAccount.name}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(transfer.amount.toNumber())}
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                    {transfer.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/transfers/${transfer.id}/edit`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
