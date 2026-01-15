import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ArrowLeftRight,
  DollarSign,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getAccountsWithBalances } from "@/features/accounts/queries";
import { getIncomes } from "@/features/incomes/queries";
import { getExpenses } from "@/features/expenses/queries";
import { formatCurrency, formatDate, getCurrentMonthRange } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IncomeWithRelations, ExpenseWithRelations } from "@/types";

type Transaction = {
  id: string;
  type: "income" | "expense";
  date: Date;
  description: string | null;
  amount: number;
  categoryName: string;
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const userName = session.user.name || session.user.email.split("@")[0];

  // Get current month range for filtering
  const { start, end } = getCurrentMonthRange();
  const dateRange = { from: start, to: end };

  // Fetch all data in parallel
  const [accounts, allIncomes, allExpenses, monthlyIncomes, monthlyExpenses] =
    await Promise.all([
      getAccountsWithBalances(userId),
      getIncomes(userId),
      getExpenses(userId),
      getIncomes(userId, { dateRange }),
      getExpenses(userId, { dateRange }),
    ]);

  // Calculate totals
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalMonthlyIncome = monthlyIncomes.reduce(
    (sum, inc) => sum + inc.amount,
    0
  );
  const totalMonthlyExpenses = monthlyExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );
  const netBalance = totalMonthlyIncome - totalMonthlyExpenses;

  // Combine and sort recent transactions (last 5)
  const recentTransactions: Transaction[] = [
    ...allIncomes.slice(0, 5).map(
      (inc: IncomeWithRelations): Transaction => ({
        id: inc.id,
        type: "income",
        date: inc.date,
        description: inc.description,
        amount: inc.amount,
        categoryName: inc.category.name,
      })
    ),
    ...allExpenses.slice(0, 5).map(
      (exp: ExpenseWithRelations): Transaction => ({
        id: exp.id,
        type: "expense",
        date: exp.date,
        description: exp.description,
        amount: exp.amount,
        categoryName: exp.category.name,
      })
    ),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Get current month name for display
  const currentMonthName = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your finances for {currentMonthName}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalMonthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalMonthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net</CardTitle>
            {netBalance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                netBalance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {netBalance >= 0 ? "+" : ""}
              {formatCurrency(netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Income - Expenses this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            Quickly add new transactions or transfers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/incomes/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Income
              </Link>
            </Button>
            <Button asChild variant="destructive">
              <Link href="/expenses/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/transfers/new">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Transfer
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  <Plus className="mr-2 h-4 w-4" />
                  Create Account
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {accounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
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
                        account.balance >= 0
                          ? "text-green-600"
                          : "text-red-600"
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
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/incomes">
                Incomes
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/expenses">
                Expenses
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No transactions yet
              </p>
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
                    href={`/${transaction.type === "income" ? "incomes" : "expenses"}/${transaction.id}/edit`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === "income"
                            ? "bg-green-100 dark:bg-green-900"
                            : "bg-red-100 dark:bg-red-900"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {transaction.description || transaction.categoryName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatDate(transaction.date)}</span>
                          <Badge
                            variant={
                              transaction.type === "income"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {transaction.type === "income"
                              ? "Income"
                              : "Expense"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        transaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
