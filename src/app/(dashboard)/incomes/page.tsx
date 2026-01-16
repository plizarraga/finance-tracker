import Link from "next/link";
import { DollarSign } from "lucide-react";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getIncomes } from "@/features/incomes/queries";
import {
  getIncomeTemplates,
  getDefaultIncomeTemplate,
} from "@/features/income-templates/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { IncomeTemplateButtonGroup } from "@/components/incomes/income-template-button-group";
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
  try {
    await requireAuth();
  } catch (error) {
    if (isUnauthorizedError(error)) {
      redirect("/login");
    }
    throw error;
  }

  const [incomes, templates, defaultTemplate] = await Promise.all([
    getIncomes(),
    getIncomeTemplates(),
    getDefaultIncomeTemplate(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incomes"
        description="Track your income transactions"
        action={
          <IncomeTemplateButtonGroup
            templates={templates}
            defaultTemplate={defaultTemplate}
            variant="default"
          />
        }
      />

      {incomes.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-8 w-8" />}
          title="No incomes yet"
          description="Record your first income to start tracking your earnings."
          action={
            <IncomeTemplateButtonGroup
              templates={templates}
              defaultTemplate={defaultTemplate}
              variant="default"
            />
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
