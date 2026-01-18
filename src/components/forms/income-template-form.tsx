"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
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
  incomeTemplateSchema,
  type IncomeTemplateInput,
} from "@/features/income-templates/schemas";
import type { IncomeTemplateWithRelations } from "@/features/income-templates/queries";
import type { Account, Category } from "@prisma/client";
import { CategoryCombobox } from "@/components/shared/category-combobox";

function normalizeAmount(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return value;
}

type IncomeTemplateWithNotes = IncomeTemplateWithRelations & {
  notes?: string | null;
};

interface IncomeTemplateFormProps {
  template?: IncomeTemplateWithNotes;
  accounts: Account[];
  categories: Category[];
  onSubmit: (formData: FormData) => Promise<void>;
}

export function IncomeTemplateForm({
  template,
  accounts,
  categories,
  onSubmit,
}: IncomeTemplateFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<IncomeTemplateInput>({
    resolver: zodResolver(incomeTemplateSchema),
    defaultValues: {
      name: template?.name ?? "",
      accountId: template?.accountId ?? null,
      categoryId: template?.categoryId ?? null,
      amount: normalizeAmount(template?.amount),
      description: template?.description ?? "",
      notes: template?.notes ?? "",
    },
  });

  const handleSubmit = (values: IncomeTemplateInput) => {
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
                  placeholder="e.g., Salary, Freelance, Bonus"
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="Default description for this type of income..."
                  disabled={isPending}
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
                    <SelectValue placeholder="Don't prefill" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No default account</SelectItem>
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
                  type="income"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => {
            const { value, ...rest } = field;
            return (
            <FormItem>
              <FormLabel>Amount (optional)</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>$</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={isPending}
                    {...rest}
                    value={value === 0 ? "" : value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? null : Number.parseFloat(value) || null);
                    }}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>USD</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
            );
          }}
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
