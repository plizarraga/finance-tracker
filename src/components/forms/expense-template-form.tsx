"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  expenseTemplateSchema,
  type ExpenseTemplateInput,
} from "@/features/expense-templates/schemas";
import type { ExpenseTemplateWithRelations } from "@/features/expense-templates/queries";
import type { Account, Category } from "@prisma/client";
import { CategoryCombobox } from "@/components/shared/category-combobox";

function normalizeAmount(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return value;
}

type ExpenseTemplateWithNotes = ExpenseTemplateWithRelations & {
  notes?: string | null;
};

interface ExpenseTemplateFormProps {
  template?: ExpenseTemplateWithNotes;
  accounts: Account[];
  categories: Category[];
  onSubmit: (formData: FormData) => Promise<void>;
}

export function ExpenseTemplateForm({
  template,
  accounts,
  categories,
  onSubmit,
}: ExpenseTemplateFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ExpenseTemplateInput>({
    resolver: zodResolver(expenseTemplateSchema),
    defaultValues: {
      name: template?.name ?? "",
      accountId: template?.accountId ?? null,
      categoryId: template?.categoryId ?? null,
      amount: normalizeAmount(template?.amount),
      description: template?.description ?? "",
      notes: template?.notes ?? "",
    },
  });

  const handleSubmit = (values: ExpenseTemplateInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", values.name);
      if (values.accountId) formData.append("accountId", values.accountId);
      if (values.categoryId) formData.append("categoryId", values.categoryId);
      if (values.amount !== null && values.amount !== undefined) {
        formData.append("amount", values.amount.toString());
      }
      formData.append("description", values.description);
      if (values.notes) formData.append("notes", values.notes);
      await onSubmit(formData);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Netflix, Groceries, Gas"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A descriptive name to identify this template
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account (optional)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                value={field.value ?? "none"}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="No pre-selection" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No pre-selection</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category (optional)</FormLabel>
              <FormControl>
                <CategoryCombobox
                  categories={categories.filter(cat => cat.id !== "none")}
                  value={field.value ?? ""}
                  onValueChange={(value) => field.onChange(value || null)}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={isPending}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? null : Number.parseFloat(value) || null);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Default description for this type of expense..."
                  disabled={isPending}
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes..."
                  disabled={isPending}
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? template
                ? "Saving..."
                : "Creating..."
              : template
                ? "Save Template"
                : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
