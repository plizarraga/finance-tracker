import { headers } from "next/headers";
import Link from "next/link";
import { Wallet, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getAccountsWithBalances } from "@/features/accounts/queries";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function AccountsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const accounts = await getAccountsWithBalances(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Manage your financial accounts"
        action={
          <Button asChild>
            <Link href="/accounts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Account
            </Link>
          </Button>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Create your first account to start tracking your finances."
          action={
            <Button asChild>
              <Link href="/accounts/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Account
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Link key={account.id} href={`/accounts/${account.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                    {account.name}
                  </CardTitle>
                  {account.description && (
                    <CardDescription className="line-clamp-2">
                      {account.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-2xl font-bold ${
                      account.balance >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current Balance
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
