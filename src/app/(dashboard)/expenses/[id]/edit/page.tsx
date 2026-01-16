"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ExpenseForm } from "@/components/forms/expense-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { updateExpense, deleteExpense } from "@/features/expenses/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { ExpenseWithRelations } from "@/features/expenses/queries";
import type { Account, Category } from "@prisma/client";

export default function EditExpensePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [expense, setExpense] = useState<ExpenseWithRelations | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const expenseId = params.id as string;

  useEffect(() => {
    async function fetchData() {
      try {
        const [expenseResponse, accountsResponse, categoriesResponse] =
          await Promise.all([
            fetch(`/api/expenses/${expenseId}`),
            fetch("/api/accounts"),
            fetch("/api/categories?type=expense"),
          ]);

        if (expenseResponse.ok) {
          const expenseData = await expenseResponse.json();
          setExpense(expenseData);
        } else {
          router.push("/expenses");
          return;
        }

        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setAccounts(accountsData);
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }
      } catch {
        router.push("/expenses");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [expenseId, router]);

  const handleSubmit = async (formData: FormData) => {
    const result = await updateExpense(expenseId, formData);

    if (result.success) {
      toast({
        title: "Expense updated",
        description: "Your expense has been updated successfully.",
      });
      router.push("/expenses");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteExpense(expenseId);

    if (result.success) {
      toast({
        title: "Expense deleted",
        description: "Your expense has been deleted successfully.",
      });
      router.push("/expenses");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete expense",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Expense not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Expense"
        description={expense.description || "Edit expense details"}
        action={
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button variant="outline" asChild>
              <Link href="/expenses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Expenses
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <ExpenseForm
            expense={expense}
            accounts={accounts}
            categories={categories}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        onConfirm={handleDelete}
        destructive
        confirmText="Delete"
      />
    </div>
  );
}
