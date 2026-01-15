import { z } from "zod";

// Schema for form validation (with explicit types for react-hook-form)
export const incomeSchema = z.object({
  accountId: z.string().uuid("Select an account"),
  categoryId: z.string().uuid("Select a category"),
  amount: z.number().positive("Amount must be positive"),
  date: z.date(),
  description: z.string().max(500).optional().nullable(),
});

// Schema for server-side validation (with coercion for FormData)
export const incomeServerSchema = z.object({
  accountId: z.string().uuid("Select an account"),
  categoryId: z.string().uuid("Select a category"),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.coerce.date(),
  description: z.string().max(500).optional().nullable(),
});

export type IncomeInput = z.infer<typeof incomeSchema>;
