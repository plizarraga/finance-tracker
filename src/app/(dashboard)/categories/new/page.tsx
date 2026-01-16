"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createCategory } from "@/features/categories/api";
import { PageHeader } from "@/components/shared/page-header";
import { CategoryForm } from "@/components/forms/category-form";
import { Card, CardContent } from "@/components/ui/card";

export default function NewCategoryPage() {
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    const result = await createCategory(formData);

    if (result.success) {
      toast({
        title: "Category created",
        description: "Your category has been created successfully.",
      });
      router.push("/categories");
    } else {
      toast({
        title: "Error",
        description: result.error ?? "Failed to create category",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Category"
        description="Create a new category to organize your transactions"
      />

      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <CategoryForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
