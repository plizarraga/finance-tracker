"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { ArrowRight } from "lucide-react";
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
  transferSchema,
  type TransferInput,
} from "@/features/transfers/schemas";
import type { Transfer, Account } from "@prisma/client";
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

interface TransferFormProps {
  transfer?: Transfer;
  accounts: Account[];
  onSubmit: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<TransferInput>;
}

export function TransferForm({
  transfer,
  accounts,
  onSubmit,
  defaultValues,
}: TransferFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: defaultValues?.fromAccountId ?? transfer?.fromAccountId ?? "",
      toAccountId: defaultValues?.toAccountId ?? transfer?.toAccountId ?? "",
      amount: defaultValues?.amount ?? normalizeAmount(transfer?.amount),
      date: normalizeDate(transfer?.date),
      description: defaultValues?.description ?? transfer?.description ?? "",
      notes: transfer?.notes ?? "",
    },
  });

  const handleSubmit = (values: TransferInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("fromAccountId", values.fromAccountId);
      formData.append("toAccountId", values.toAccountId);
      formData.append("amount", values.amount.toString());
      formData.append(
        "date",
        values.date instanceof Date
          ? values.date.toISOString()
          : new Date(values.date).toISOString()
      );
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
                  placeholder="Add a description for this transfer..."
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
                  value={field.value || new Date()}
                  onChange={field.onChange}
                  disabled={isPending}
                  placeholder="Select a date"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <FormField
            control={form.control}
            name="fromAccountId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>From Account</FormLabel>
                <FormControl>
                  <AccountCombobox
                    accounts={accounts}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                    placeholder="Select source account"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="hidden h-10 items-center justify-center sm:flex">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <FormField
            control={form.control}
            name="toAccountId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>To Account</FormLabel>
                <FormControl>
                  <AccountCombobox
                    accounts={accounts}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                    placeholder="Select destination account"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => {
            const { value, ...rest } = field;
            return (
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
                    {...rest}
                    value={value === 0 ? "" : value ?? ""}
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
              ? transfer
                ? "Saving..."
                : "Creating..."
              : transfer
                ? "Save Changes"
                : "Create Transfer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
