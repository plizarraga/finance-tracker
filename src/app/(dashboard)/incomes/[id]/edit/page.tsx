"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { IncomeForm } from "@/components/forms/income-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { updateIncome, deleteIncome } from "@/features/incomes/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { IncomeWithRelations } from "@/features/incomes/queries";
import type { Account, Category } from "@prisma/client";

export default function EditIncomePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [income, setIncome] = useState<IncomeWithRelations | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const incomeId = params.id as string;

  useEffect(() => {
    async function fetchData() {
      try {
        const [incomeRes, accountsRes, categoriesRes] = await Promise.all([
          fetch(`/api/incomes/${incomeId}`),
          fetch("/api/accounts"),
          fetch("/api/categories?type=income"),
        ]);

        if (incomeRes.ok) {
          const incomeData = await incomeRes.json();
          setIncome(incomeData);
        } else {
          router.push("/incomes");
          return;
        }

        if (accountsRes.ok) {
          const accountsData = await accountsRes.json();
          setAccounts(accountsData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch {
        router.push("/incomes");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [incomeId, router]);

  const handleSubmit = async (formData: FormData) => {
    const result = await updateIncome(incomeId, formData);

    if (result.success) {
      toast({
        title: "Income updated",
        description: "Your income has been updated successfully.",
      });
      router.push("/incomes");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update income",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteIncome(incomeId);

    if (result.success) {
      toast({
        title: "Income deleted",
        description: "The income has been deleted successfully.",
      });
      router.push("/incomes");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete income",
        variant: "destructive",
      });
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!income) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Income not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Income"
        description="Update income transaction details"
        action={
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button variant="outline" asChild>
              <Link href="/incomes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Incomes
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <IncomeForm
            income={income}
            accounts={accounts}
            categories={categories}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Income"
        description="Are you sure you want to delete this income? This action cannot be undone."
        onConfirm={handleDelete}
        destructive
        confirmText="Delete"
      />
    </div>
  );
}
