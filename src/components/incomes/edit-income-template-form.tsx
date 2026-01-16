"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IncomeTemplateForm } from "@/components/forms/income-template-form";
import { updateIncomeTemplate } from "@/features/income-templates/api";
import { useToast } from "@/hooks/use-toast";
import type { IncomeTemplateWithRelations } from "@/features/income-templates/queries";
import type { Account, Category } from "@/types";

interface EditIncomeTemplateFormProps {
  templateId: string;
  template: IncomeTemplateWithRelations;
}

export function EditIncomeTemplateForm({
  templateId,
  template,
}: EditIncomeTemplateFormProps) {
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
    const result = await updateIncomeTemplate(templateId, formData);

    if (result.success) {
      toast({
        title: "Template updated",
        description: "Your income template has been updated successfully.",
      });
      router.push("/incomes");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update template",
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
    <IncomeTemplateForm
      template={template}
      accounts={accounts}
      categories={categories}
      onSubmit={handleSubmit}
    />
  );
}
