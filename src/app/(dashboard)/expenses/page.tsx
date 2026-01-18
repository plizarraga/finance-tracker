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
import { endOfDay, startOfDay, startOfMonth } from "date-fns";
import { parseDate } from "@/lib/format";

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
    dateFrom?: string;
    dateTo?: string;
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
  const now = new Date();
  const defaultDateFrom = startOfDay(startOfMonth(now));
  const defaultDateTo = endOfDay(now);
  const dateFrom = params.dateFrom
    ? startOfDay(parseDate(params.dateFrom))
    : defaultDateFrom;
  const dateTo = params.dateTo ? endOfDay(parseDate(params.dateTo)) : defaultDateTo;

  // Build filters
  const filters = {
    page,
    pageSize,
    sortBy,
    sortOrder,
    dateRange: {
      from: dateFrom,
      to: dateTo,
    },
    ...(params.description && { description: params.description }),
    ...(params.categoryId && { categoryId: params.categoryId }),
    ...(params.accountId && { accountId: params.accountId }),
    ...(params.amountMin && { amountMin: parseFloat(params.amountMin) }),
    ...(params.amountMax && { amountMax: parseFloat(params.amountMax) }),
  };

  const [
    expenses,
    totalCount,
    totalCountAll,
    templates,
    defaultTemplate,
    categories,
    accounts,
  ] = await Promise.all([
    getExpenses(filters),
    getExpensesCount(filters),
    getExpensesCount(),
    getExpenseTemplates(),
    getDefaultExpenseTemplate(),
    getCategoriesByType("expense"),
    getAccounts(),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Prepare filter options
  const hasActiveFilters = Boolean(
    params.description ||
      params.categoryId ||
      params.accountId ||
      params.amountMin ||
      params.amountMax ||
      params.dateFrom ||
      params.dateTo
  );
  const shouldShowEmptyState = totalCount === 0 && !hasActiveFilters && totalCountAll === 0;

  const accountOptions = accounts.map((account) => ({
    id: account.id,
    name: account.name,
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
            variant="default"
          />
        }
      />

      {shouldShowEmptyState ? (
        <EmptyState
          icon={<Receipt className="h-8 w-8" />}
          title="No expenses yet"
          description="Record your first expense to start tracking your spending."
          action={
            <ExpenseTemplateButtonGroup
              templates={templates}
              defaultTemplate={defaultTemplate}
              variant="default"
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
              categories={categories}
              accounts={accountOptions}
            />
          }
        />
      )}
    </div>
  );
}
