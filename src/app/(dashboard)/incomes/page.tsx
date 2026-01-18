import { DollarSign } from "lucide-react";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getIncomes, getIncomesCount } from "@/features/incomes/queries";
import {
  getIncomeTemplates,
  getDefaultIncomeTemplate,
} from "@/features/income-templates/queries";
import { getCategoriesByType } from "@/features/categories/queries";
import { getAccounts } from "@/features/accounts/queries";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { IncomeTemplateButtonGroup } from "@/components/incomes/income-template-button-group";
import { DataTable } from "@/components/shared/data-table";
import { DataTableToolbar } from "@/components/shared/data-table-toolbar";
import { incomeColumns } from "@/components/incomes/income-columns";
import { serializeForClient } from "@/lib/serialize";
import { redirect } from "next/navigation";
import { DEFAULT_PAGE_SIZE } from "@/components/shared/table-constants";
import { endOfDay, startOfDay, startOfMonth } from "date-fns";
import { parseDate } from "@/lib/format";

interface IncomesPageProps {
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

export default async function IncomesPage({ searchParams }: IncomesPageProps) {
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
    incomes,
    totalCount,
    totalCountAll,
    templates,
    defaultTemplate,
    categories,
    accounts,
  ] = await Promise.all([
    getIncomes(filters),
    getIncomesCount(filters),
    getIncomesCount(),
    getIncomeTemplates(),
    getDefaultIncomeTemplate(),
    getCategoriesByType("income"),
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
        title="Incomes"
        description="Track your income transactions"
      />

      {shouldShowEmptyState ? (
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
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <DataTableToolbar
              searchPlaceholder="Filter by description..."
              categories={categories}
              accounts={accountOptions}
            />
            <IncomeTemplateButtonGroup
              templates={templates}
              defaultTemplate={defaultTemplate}
              variant="default"
              compact
            />
          </div>
          <DataTable
            columns={incomeColumns}
            data={serializeForClient(incomes)}
            pageCount={totalPages}
            totalCount={totalCount}
          />
        </div>
      )}
    </div>
  );
}
