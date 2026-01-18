"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { IncomeForm } from "@/components/forms/income-form";
import { createIncome } from "@/features/incomes/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Account, Category } from "@/types";
import type { IncomeInput } from "@/features/incomes/schemas";

export default function NewIncomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Extract query params for pre-filling from template
  const defaultValues: Partial<IncomeInput> = {
    accountId: searchParams.get("accountId") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    amount: searchParams.get("amount")
      ? Number.parseFloat(searchParams.get("amount")!)
      : undefined,
    description: searchParams.get("description") ?? undefined,
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [accountsRes, categoriesRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/categories?type=income"),
        ]);

        if (accountsRes.ok) {
          const accountsData = await accountsRes.json();
          setAccounts(accountsData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    const result = await createIncome(formData);

    if (result.success) {
      toast({
        title: "Income created",
        description: "Your new income has been recorded successfully.",
      });
      router.push("/incomes");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create income",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Income"
        description="Record a new income transaction"
        action={
          <Button variant="outline" asChild>
            <Link href="/incomes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Incomes
            </Link>
          </Button>
        }
      />

      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <IncomeForm
            accounts={accounts}
            categories={categories}
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
          />
        </CardContent>
      </Card>
    </div>
  );
}
