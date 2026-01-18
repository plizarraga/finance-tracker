"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createCategory } from "@/features/categories/api";

const quickCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

type QuickCategoryInput = z.infer<typeof quickCategorySchema>;

interface CategoryQuickCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated: (categoryId: string, categoryName: string) => void;
  type?: "income" | "expense";
}

export function CategoryQuickCreateDialog({
  open,
  onOpenChange,
  onCategoryCreated,
  type = "expense",
}: CategoryQuickCreateDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<QuickCategoryInput>({
    resolver: zodResolver(quickCategorySchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values: QuickCategoryInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("type", type);

      const result = await createCategory(formData);

      if (result.success && result.data) {
        toast({
          title: "Category created",
          description: "Category created successfully.",
        });
        onCategoryCreated(result.data.id, result.data.name);
        form.reset();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create category",
          variant: "destructive",
        });
      }
    });
  };
  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create {type === "income" ? "Income" : "Expense"} Category</DialogTitle>
          <DialogDescription>
            Create a category for {type === "income" ? "incomes" : "expenses"}. You can create it quickly here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(event) => {
              event.stopPropagation();
              handleSubmit(event);
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Groceries, Transportation"
                      disabled={isPending}
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
