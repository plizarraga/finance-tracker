import { ArrowLeftRight } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getTransfers, getTransfersCount } from "@/features/transfers/queries";
import {
  getTransferTemplates,
  getDefaultTransferTemplate,
} from "@/features/transfer-templates/queries";
import { getAccounts } from "@/features/accounts/queries";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TransferTemplateButtonGroup } from "@/components/transfers/transfer-template-button-group";
import { DataTable } from "@/components/shared/data-table";
import { DataTableToolbar } from "@/components/shared/data-table-toolbar";
import { transferColumns } from "@/components/transfers/transfer-columns";
import { serializeForClient } from "@/lib/serialize";
import { DEFAULT_PAGE_SIZE } from "@/components/shared/table-constants";
import { endOfDay, startOfDay, startOfMonth } from "date-fns";
import { parseDate } from "@/lib/format";

interface TransfersPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortOrder?: string;
    description?: string;
    accountId?: string;
    fromAccountId?: string;
    toAccountId?: string;
    amountMin?: string;
    amountMax?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function TransfersPage({
  searchParams,
}: TransfersPageProps) {
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
    | "fromAccount"
    | "toAccount";
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
    ...(params.accountId && { accountId: params.accountId }),
    ...(params.fromAccountId && { fromAccountId: params.fromAccountId }),
    ...(params.toAccountId && { toAccountId: params.toAccountId }),
    ...(params.amountMin && { amountMin: parseFloat(params.amountMin) }),
    ...(params.amountMax && { amountMax: parseFloat(params.amountMax) }),
  };

  const [
    transfers,
    totalCount,
    totalCountAll,
    templates,
    defaultTemplate,
    accounts,
  ] = await Promise.all([
    getTransfers(filters),
    getTransfersCount(filters),
    getTransfersCount(),
    getTransferTemplates(),
    getDefaultTransferTemplate(),
    getAccounts(),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const hasActiveFilters = Boolean(
    params.description ||
      params.accountId ||
      params.fromAccountId ||
      params.toAccountId ||
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
        title="Transfers"
        description="Transfer money between your accounts"
        action={
          <TransferTemplateButtonGroup
            templates={templates}
            defaultTemplate={defaultTemplate}
            variant="default"
          />
        }
      />

      {shouldShowEmptyState ? (
        <EmptyState
          icon={<ArrowLeftRight className="h-8 w-8" />}
          title="No transfers yet"
          description="Create your first transfer to move money between accounts."
          action={
            <TransferTemplateButtonGroup
              templates={templates}
              defaultTemplate={defaultTemplate}
              variant="default"
            />
          }
        />
      ) : (
        <DataTable
          columns={transferColumns}
          data={serializeForClient(transfers)}
          pageCount={totalPages}
          totalCount={totalCount}
          filterComponent={
            <DataTableToolbar
              searchPlaceholder="Filter by description..."
              accounts={accountOptions}
            />
          }
        />
      )}
    </div>
  );
}
