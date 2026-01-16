import { headers } from "next/headers";
import Link from "next/link";
import { DollarSign, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getIncomes } from "@/features/incomes/queries";
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
import { redirect } from "next/navigation";

export default async function IncomesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const incomes = await getIncomes(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incomes"
        description="Track your income transactions"
        action={
          <Button asChild>
            <Link href="/incomes/new">
              <Plus className="mr-2 h-4 w-4" />
              New Income
            </Link>
          </Button>
        }
      />

      {incomes.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-8 w-8" />}
          title="No incomes yet"
          description="Record your first income to start tracking your earnings."
          action={
            <Button asChild>
              <Link href="/incomes/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Income
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
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell className="font-medium">
                    {formatDate(income.date)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/incomes/${income.id}/edit`}
                      className="hover:underline"
                    >
                      {income.description || "-"}
                    </Link>
                  </TableCell>
                  <TableCell>{income.category.name}</TableCell>
                  <TableCell>{income.account.name}</TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400 font-medium">
                    {formatCurrency(income.amount.toNumber())}
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
