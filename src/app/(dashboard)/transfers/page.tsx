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

interface TransfersPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortOrder?: string;
    description?: string;
    fromAccountId?: string;
    toAccountId?: string;
    amountMin?: string;
    amountMax?: string;
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

  // Build filters
  const filters = {
    page,
    pageSize,
    sortBy,
    sortOrder,
    ...(params.description && { description: params.description }),
    ...(params.fromAccountId && { fromAccountId: params.fromAccountId }),
    ...(params.toAccountId && { toAccountId: params.toAccountId }),
    ...(params.amountMin && { amountMin: parseFloat(params.amountMin) }),
    ...(params.amountMax && { amountMax: parseFloat(params.amountMax) }),
  };

  const [transfers, totalCount, templates, defaultTemplate, accounts] =
    await Promise.all([
      getTransfers(filters),
      getTransfersCount(filters),
      getTransferTemplates(),
      getDefaultTransferTemplate(),
      getAccounts(),
    ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Prepare filter options
  const accountOptions = accounts.map((acc) => ({
    label: acc.name,
    value: acc.id,
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
            variant="outline"
          />
        }
      />

      {totalCount === 0 &&
      !params.description &&
      !params.fromAccountId &&
      !params.toAccountId &&
      !params.amountMin &&
      !params.amountMax ? (
        <EmptyState
          icon={<ArrowLeftRight className="h-8 w-8" />}
          title="No transfers yet"
          description="Create your first transfer to move money between accounts."
          action={
            <TransferTemplateButtonGroup
              templates={templates}
              defaultTemplate={defaultTemplate}
              variant="outline"
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
              fromAccountOptions={accountOptions}
              toAccountOptions={accountOptions}
            />
          }
        />
      )}
    </div>
  );
}
