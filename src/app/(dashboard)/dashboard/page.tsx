import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  DollarSign,
  CreditCard,
  ArrowRight,
  ArrowLeftRight,
} from 'lucide-react';
import { requireAuth, isUnauthorizedError } from '@/lib/prisma-helpers';
import { getAccountsWithBalances } from '@/features/accounts/queries';
import {
  getIncomes,
  type IncomeWithRelations,
} from '@/features/incomes/queries';
import {
  getExpenses,
  type ExpenseWithRelations,
} from '@/features/expenses/queries';
import {
  getExpenseTemplates,
  getDefaultExpenseTemplate,
} from '@/features/expense-templates/queries';
import {
  getIncomeTemplates,
  getDefaultIncomeTemplate,
} from '@/features/income-templates/queries';
import {
  getTransferTemplates,
  getDefaultTransferTemplate,
} from '@/features/transfer-templates/queries';
import {
  getTransfers,
  type TransferWithRelations,
} from '@/features/transfers/queries';
import { formatCurrency, formatDateOnly, getCurrentMonthRange } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { IncomeTemplateButtonGroup } from '@/components/incomes/income-template-button-group';
import { ExpenseTemplateButtonGroup } from '@/components/expenses/expense-template-button-group';
import { TransferTemplateButtonGroup } from '@/components/transfers/transfer-template-button-group';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Transaction = {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  date: Date;
  description: string | null;
  amount: number;
  categoryName: string;
};

export default async function DashboardPage() {
  let session;
  try {
    ({ session } = await requireAuth());
  } catch (error) {
    if (isUnauthorizedError(error)) {
      redirect('/login');
    }
    throw error;
  }

  const userName = session.user.name || session.user.email.split('@')[0];

  // Get current month range for filtering
  const { start, end } = getCurrentMonthRange();
  const dateRange = { from: start, to: end };

  // Fetch all data in parallel
  const [
    accounts,
    allIncomes,
    allExpenses,
    allTransfers,
    monthlyIncomes,
    monthlyExpenses,
    expenseTemplates,
    defaultExpenseTemplate,
    incomeTemplates,
    defaultIncomeTemplate,
    transferTemplates,
    defaultTransferTemplate,
  ] = await Promise.all([
    getAccountsWithBalances(),
    getIncomes(),
    getExpenses(),
    getTransfers(),
    getIncomes({ dateRange }),
    getExpenses({ dateRange }),
    getExpenseTemplates(),
    getDefaultExpenseTemplate(),
    getIncomeTemplates(),
    getDefaultIncomeTemplate(),
    getTransferTemplates(),
    getDefaultTransferTemplate(),
  ]);

  // Calculate totals
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalMonthlyIncome = monthlyIncomes.reduce(
    (sum, inc) => sum + inc.amount.toNumber(),
    0
  );
  const totalMonthlyExpenses = monthlyExpenses.reduce(
    (sum, exp) => sum + exp.amount.toNumber(),
    0
  );
  const netBalance = totalMonthlyIncome - totalMonthlyExpenses;

  // Combine and sort recent transactions (last 15)
  const recentTransactions: Transaction[] = [
    ...allIncomes.slice(0, 10).map(
      (inc: IncomeWithRelations): Transaction => ({
        id: inc.id,
        type: 'income',
        date: inc.date,
        description: inc.description,
        amount: inc.amount.toNumber(),
        categoryName: inc.category.name,
      })
    ),
    ...allExpenses.slice(0, 10).map(
      (exp: ExpenseWithRelations): Transaction => ({
        id: exp.id,
        type: 'expense',
        date: exp.date,
        description: exp.description,
        amount: exp.amount.toNumber(),
        categoryName: exp.category.name,
      })
    ),
    ...allTransfers.slice(0, 10).map(
      (transfer: TransferWithRelations): Transaction => ({
        id: transfer.id,
        type: 'transfer',
        date: transfer.date,
        description: transfer.description,
        amount: transfer.amount.toNumber(),
        categoryName: `${transfer.fromAccount.name} -> ${transfer.toAccount.name}`,
      })
    ),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Get current month name for display
  const currentMonthName = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-2 md:space-y-8">
      {/* Welcome Section */}
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your finances for {currentMonthName}
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Income
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Create a new income from templates.
            </p>
            <IncomeTemplateButtonGroup
              templates={incomeTemplates}
              defaultTemplate={defaultIncomeTemplate}
              variant="default"
              fullWidth
            />
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Expense
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Log an expense using your templates.
            </p>
            <ExpenseTemplateButtonGroup
              templates={expenseTemplates}
              defaultTemplate={defaultExpenseTemplate}
              variant="default"
              fullWidth
            />
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ArrowLeftRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              Transfer
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Move funds between accounts quickly.
            </p>
            <TransferTemplateButtonGroup
              templates={transferTemplates}
              defaultTemplate={defaultTransferTemplate}
              variant="default"
              fullWidth
            />
          </div>
        </div>
      </div>
      {/* Account Balances Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Account Balances</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/accounts">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {accounts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No accounts yet</p>
              <Button asChild>
                <Link href="/accounts/new">
                  <Wallet className="mr-2 h-4 w-4" />
                  Create Account
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {accounts.map((account) => (
              <Card
                key={account.id}
                className="hover:shadow-md transition-shadow"
              >
                <Link href={`/accounts/${account.id}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {account.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-xl font-bold ${
                        account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(account.balance)}
                    </div>
                    {account.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {account.description}
                      </p>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
        </div>

        {recentTransactions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No transactions yet</p>
              <div className="flex justify-center gap-3">
                <Button asChild>
                  <Link href="/incomes/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Income
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/expenses/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentTransactions.map((transaction) => (
                  <Link
                    key={`${transaction.type}-${transaction.id}`}
                    href={`/${
                      transaction.type === 'income'
                        ? 'incomes'
                        : transaction.type === 'expense'
                        ? 'expenses'
                        : 'transfers'
                    }/${transaction.id}/edit`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-100 dark:bg-green-900'
                            : transaction.type === 'expense'
                            ? 'bg-red-100 dark:bg-red-900'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : transaction.type === 'expense' ? (
                          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <ArrowLeftRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {transaction.description || transaction.categoryName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatDateOnly(transaction.date)}</span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              transaction.type === 'income'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                                : transaction.type === 'expense'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {transaction.type === 'income'
                              ? 'Income'
                              : transaction.type === 'expense'
                              ? 'Expense'
                              : 'Transfer'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        transaction.type === 'income'
                          ? 'text-green-600 dark:text-green-400'
                          : transaction.type === 'expense'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {transaction.type === 'income'
                        ? '+'
                        : transaction.type === 'expense'
                        ? '-'
                        : ''}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Summary</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-semibold">
                {formatCurrency(totalBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {accounts.length} account
                {accounts.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium">
                Total Income
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-semibold text-green-600">
                {formatCurrency(totalMonthlyIncome)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-semibold text-red-600">
                {formatCurrency(totalMonthlyExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium">Net</CardTitle>
              {netBalance >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div
                className={`text-xl font-semibold ${
                  netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {netBalance >= 0 ? '+' : ''}
                {formatCurrency(netBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Income - Expenses this month
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
