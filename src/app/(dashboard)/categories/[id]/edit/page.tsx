"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  updateCategory,
  deleteCategory,
} from "@/features/categories/actions";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CategoryForm } from "@/components/forms/category-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchCategory() {
      // Fetch category client-side since we need user context
      const response = await fetch(`/api/categories/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCategory({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        });
      }
      setLoading(false);
    }
    fetchCategory();
  }, [id]);

  async function handleSubmit(formData: FormData) {
    const result = await updateCategory(id, formData);

    if (result.success) {
      toast({
        title: "Category updated",
        description: "Your category has been updated successfully.",
      });
      router.push("/categories");
    } else {
      toast({
        title: "Error",
        description: result.error ?? "Failed to update category",
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteCategory(id);

    if (result.success) {
      toast({
        title: "Category deleted",
        description: "Your category has been deleted successfully.",
      });
      router.push("/categories");
    } else {
      toast({
        title: "Error",
        description: result.error ?? "Failed to delete category",
        variant: "destructive",
      });
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Category" />
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 w-32 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <PageHeader title="Category Not Found" />
        <p className="text-muted-foreground">
          The category you are looking for does not exist or you do not have
          access to it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Category"
        description="Update your category details"
        action={
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        }
      />

      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <CategoryForm category={category} onSubmit={handleSubmit} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone. Any transactions using this category may be affected."
        onConfirm={handleDelete}
        destructive
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
