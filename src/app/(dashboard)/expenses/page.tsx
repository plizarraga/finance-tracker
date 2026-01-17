import { Receipt } from "lucide-react";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getExpenses, getExpensesCount } from "@/features/expenses/queries";
import {
  getExpenseTemplates,
  getDefaultExpenseTemplate,
} from "@/features/expense-templates/queries";
import { getCategoriesByType } from "@/features/categories/queries";
import { getAccounts } from "@/features/accounts/queries";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ExpenseTemplateButtonGroup } from "@/components/expenses/expense-template-button-group";
import { DataTable } from "@/components/shared/data-table";
import { DataTableToolbar } from "@/components/shared/data-table-toolbar";
import { expenseColumns } from "@/components/expenses/expense-columns";
import { serializeForClient } from "@/lib/serialize";
import { redirect } from "next/navigation";
import { DEFAULT_PAGE_SIZE } from "@/components/shared/table-constants";

interface ExpensesPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortOrder?: string;
    description?: string;
    categoryId?: string;
    accountId?: string;
    amountMin?: string;
    amountMax?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  try {
    await requireAuth();
  } catch (error) {
    if (isUnauthorizedError(error)) {
      redirect("/login");
    }
    throw error;
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = parseInt(params.pageSize || DEFAULT_PAGE_SIZE.toString(), 10);
  const sortBy = (params.sortBy || "date") as
    | "date"
    | "description"
    | "amount"
    | "category"
    | "account";
  const sortOrder = (params.sortOrder || "desc") as "asc" | "desc";

  // Build filters
  const filters = {
    page,
    pageSize,
    sortBy,
    sortOrder,
    ...(params.description && { description: params.description }),
    ...(params.categoryId && { categoryId: params.categoryId }),
    ...(params.accountId && { accountId: params.accountId }),
    ...(params.amountMin && { amountMin: parseFloat(params.amountMin) }),
    ...(params.amountMax && { amountMax: parseFloat(params.amountMax) }),
  };

  const [expenses, totalCount, templates, defaultTemplate, categories, accounts] =
    await Promise.all([
      getExpenses(filters),
      getExpensesCount(filters),
      getExpenseTemplates(),
      getDefaultExpenseTemplate(),
      getCategoriesByType("expense"),
      getAccounts(),
    ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Prepare filter options
  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  const accountOptions = accounts.map((acc) => ({
    label: acc.name,
    value: acc.id,
  }));

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

      {totalCount === 0 && !params.description && !params.categoryId && !params.accountId && !params.amountMin && !params.amountMax ? (
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
        <DataTable
          columns={expenseColumns}
          data={serializeForClient(expenses)}
          pageCount={totalPages}
          totalCount={totalCount}
          filterComponent={
            <DataTableToolbar
              searchPlaceholder="Filter by description..."
              categoryOptions={categoryOptions}
              accountOptions={accountOptions}
            />
          }
        />
      )}
    </div>
  );
}
