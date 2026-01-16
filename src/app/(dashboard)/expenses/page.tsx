import Link from "next/link";
import { Receipt } from "lucide-react";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getExpenses } from "@/features/expenses/queries";
import {
  getExpenseTemplates,
  getDefaultExpenseTemplate,
} from "@/features/expense-templates/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ExpenseTemplateButtonGroup } from "@/components/expenses/expense-template-button-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { redirect } from "next/navigation";

export default async function ExpensesPage() {
  try {
    await requireAuth();
  } catch (error) {
    if (isUnauthorizedError(error)) {
      redirect("/login");
    }
    throw error;
  }

  const [expenses, templates, defaultTemplate] = await Promise.all([
    getExpenses(),
    getExpenseTemplates(),
    getDefaultExpenseTemplate(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and manage your expenses"
        action={
          <ExpenseTemplateButtonGroup
            templates={templates}
            defaultTemplate={defaultTemplate}
            variant="destructive"
          />
        }
      />

      {expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-8 w-8" />}
          title="No expenses yet"
          description="Record your first expense to start tracking your spending."
          action={
            <ExpenseTemplateButtonGroup
              templates={templates}
              defaultTemplate={defaultTemplate}
              variant="destructive"
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
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    {formatDate(expense.date)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/expenses/${expense.id}/edit`}
                      className="hover:underline"
                    >
                      {expense.description || "-"}
                    </Link>
                  </TableCell>
                  <TableCell>{expense.category.name}</TableCell>
                  <TableCell>{expense.account.name}</TableCell>
                  <TableCell className="text-right text-red-600 dark:text-red-400">
                    -{formatCurrency(expense.amount.toNumber())}
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
