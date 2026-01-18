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
} from "@/components/ui/form";
import {
  expenseSchema,
  type ExpenseInput,
} from "@/features/expenses/schemas";
import type { Expense, Account, Category } from "@prisma/client";
import { formatDateInput } from "@/lib/format";
import { CategoryCombobox } from "@/components/shared/category-combobox";
import { AccountCombobox } from "@/components/shared/account-combobox";
import { DatePickerField } from "@/components/ui/date-picker-field";

function normalizeAmount(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return 0;
}

function normalizeDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  return new Date();
}

type ExpenseWithNotes = Expense & { notes?: string | null };

interface ExpenseFormProps {
  expense?: ExpenseWithNotes;
  accounts: Account[];
  categories: Category[];
  onSubmit: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<ExpenseInput>;
}

export function ExpenseForm({
  expense,
  accounts,
  categories,
  onSubmit,
  defaultValues,
}: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      accountId: defaultValues?.accountId ?? expense?.accountId ?? "",
      categoryId: defaultValues?.categoryId ?? expense?.categoryId ?? "",
      amount: defaultValues?.amount ?? normalizeAmount(expense?.amount),
      date: normalizeDate(expense?.date),
      description: defaultValues?.description ?? expense?.description ?? "",
      notes: defaultValues?.notes ?? expense?.notes ?? "",
    },
  });

  const handleSubmit = (values: ExpenseInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("accountId", values.accountId);
      formData.append("categoryId", values.categoryId);
      formData.append("amount", values.amount.toString());
      formData.append("date", formatDateInput(values.date));
      formData.append("description", values.description);
      if (values.notes) {
        formData.append("notes", values.notes);
      }
      await onSubmit(formData);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <FormControl>
                <AccountCombobox
                  accounts={accounts}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending}
                  placeholder="Select an account"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <CategoryCombobox
                  categories={categories}
                  value={field.value}
                  onValueChange={field.onChange}
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
              <FormLabel>Amount</FormLabel>
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
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>USD</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <DatePickerField
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                  placeholder="Select a date"
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
                <Input
                  placeholder="Add a description for this expense..."
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
              ? expense
                ? "Saving..."
                : "Creating..."
              : expense
                ? "Save Changes"
                : "Create Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
