"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { ArrowRight } from "lucide-react";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  transferSchema,
  type TransferInput,
} from "@/features/transfers/schemas";
import type { Transfer, Account } from "@prisma/client";
import { formatDateInput } from "@/lib/format";

interface TransferFormProps {
  transfer?: Transfer;
  accounts: Account[];
  onSubmit: (formData: FormData) => Promise<void>;
}

export function TransferForm({
  transfer,
  accounts,
  onSubmit,
}: TransferFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: transfer?.fromAccountId ?? "",
      toAccountId: transfer?.toAccountId ?? "",
      amount: transfer?.amount?.toNumber() ?? 0,
      date: transfer?.date ?? new Date(),
      description: transfer?.description ?? "",
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
      if (values.description) {
        formData.append("description", values.description);
      }
      await onSubmit(formData);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <FormField
            control={form.control}
            name="fromAccountId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>From Account</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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

          <div className="flex h-10 items-center justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <FormField
            control={form.control}
            name="toAccountId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>To Account</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={isPending}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                  <Input
                    type="date"
                    disabled={isPending}
                    value={
                      field.value
                        ? formatDateInput(field.value)
                        : ""
                    }
                    onChange={(e) => {
                      const date = e.target.value
                        ? new Date(e.target.value)
                        : new Date();
                      field.onChange(date);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add a description for this transfer..."
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
