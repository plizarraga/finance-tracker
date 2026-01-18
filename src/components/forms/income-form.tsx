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
import { incomeSchema, type IncomeInput } from "@/features/incomes/schemas";
import type { Income, Account, Category } from "@prisma/client";
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

type IncomeWithNotes = Income & { notes?: string | null };

interface IncomeFormProps {
  income?: IncomeWithNotes;
  accounts: Account[];
  categories: Category[];
  onSubmit: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<IncomeInput>;
}

export function IncomeForm({
  income,
  accounts,
  categories,
  onSubmit,
  defaultValues,
}: IncomeFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<IncomeInput>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      accountId: defaultValues?.accountId ?? income?.accountId ?? "",
      categoryId: defaultValues?.categoryId ?? income?.categoryId ?? "",
      amount: defaultValues?.amount ?? normalizeAmount(income?.amount),
      date: normalizeDate(income?.date),
      description: defaultValues?.description ?? income?.description ?? "",
      notes: defaultValues?.notes ?? income?.notes ?? "",
    },
  });

  const handleSubmit = (values: IncomeInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("accountId", values.accountId);
      formData.append("categoryId", values.categoryId);
      formData.append("amount", values.amount.toString());
      formData.append("date", values.date.toISOString());
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="Add a description for this income..."
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
              ? income
                ? "Saving..."
                : "Creating..."
              : income
                ? "Save Changes"
                : "Create Income"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
