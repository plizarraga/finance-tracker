"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DateRangeFilter } from "@/components/reports/date-range-filter";
import { SummaryCards } from "@/components/reports/summary-cards";
import { CategoryChart } from "@/components/reports/category-chart";
import { TrendChart } from "@/components/reports/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMonthRange, formatCurrency } from "@/lib/format";
import type {
  DateRange,
  ReportSummary,
  AccountWithBalance,
  CategoryBreakdown,
} from "@/types";
import { cn } from "@/lib/utils";

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const { start, end } = getCurrentMonthRange();
    return { from: start, to: end };
  });

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);

  const fetchSummary = useCallback(async (range: DateRange) => {
    setIsLoadingSummary(true);
    try {
      const params = new URLSearchParams({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      });

      const response = await fetch(`/api/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    setIsLoadingTrends(true);
    try {
      const response = await fetch("/api/reports?months=12");
      if (response.ok) {
        const data = await response.json();
        setTrends(data.trends || []);
      }
    } catch (error) {
      console.error("Error fetching trends:", error);
    } finally {
      setIsLoadingTrends(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(dateRange);
  }, [dateRange, fetchSummary]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const handleRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="View your financial reports and analytics"
      />

      {/* Date Range Filter */}
      <DateRangeFilter
        onRangeChange={handleRangeChange}
        initialRange={dateRange}
      />

      {/* Summary Cards */}
      <SummaryCards
        totalIncome={summary?.totalIncome ?? 0}
        totalExpenses={summary?.totalExpenses ?? 0}
        netBalance={summary?.netBalance ?? 0}
        isLoading={isLoadingSummary}
      />

      {/* Category Charts - Two Columns */}
      <div className="grid gap-6 md:grid-cols-2">
        <CategoryChart
          data={summary?.incomeByCategory ?? []}
          title="Income by Category"
          type="income"
          isLoading={isLoadingSummary}
        />
        <CategoryChart
          data={summary?.expenseByCategory ?? []}
          title="Expenses by Category"
          type="expense"
          isLoading={isLoadingSummary}
        />
      </div>

      {/* Monthly Trends - Full Width */}
      <TrendChart data={trends} isLoading={isLoadingTrends} />

      {/* Account Balances */}
      <AccountBalancesList
        accounts={summary?.accountBalances ?? []}
        isLoading={isLoadingSummary}
      />
    </div>
  );
}

// Account Balances List Component
interface AccountBalancesListProps {
  accounts: AccountWithBalance[];
  isLoading: boolean;
}

function AccountBalancesList({
  accounts,
  isLoading,
}: AccountBalancesListProps) {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5" />
          Account Balances
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No accounts found. Create an account to track your balances.
          </p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{account.name}</p>
                  {account.description && (
                    <p className="text-sm text-muted-foreground">
                      {account.description}
                    </p>
                  )}
                </div>
                <p
                  className={cn(
                    "font-semibold",
                    account.balance >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {formatCurrency(account.balance)}
                </p>
              </div>
            ))}
            {/* Total Row */}
            <div className="flex items-center justify-between border-t pt-3">
              <p className="font-semibold">Total Balance</p>
              <p
                className={cn(
                  "text-lg font-bold",
                  totalBalance >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
