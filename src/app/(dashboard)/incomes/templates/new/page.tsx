"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { IncomeTemplateForm } from "@/components/forms/income-template-form";
import { createIncomeTemplate } from "@/features/income-templates/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Account, Category } from "@/types";

export default function NewIncomeTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [accountsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/categories?type=income"),
        ]);

        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setAccounts(accountsData);
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  const handleSubmit = async (formData: FormData) => {
    const result = await createIncomeTemplate(formData);

    if (result.success) {
      toast({
        title: "Template created",
        description: "Your income template has been created successfully.",
      });
      router.push("/incomes");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create template",
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
        title="New Income Template"
        description="Create a template for quick income entry"
        action={
          <Button variant="outline" asChild>
            <Link href="/incomes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Incomes
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <IncomeTemplateForm
            accounts={accounts}
            categories={categories}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
