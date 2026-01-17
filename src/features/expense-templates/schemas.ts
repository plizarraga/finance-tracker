import { z } from "zod";

// Schema for form validation (react-hook-form)
export const expenseTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  accountId: z.string().uuid("Select an account").optional().nullable(),
  categoryId: z.string().uuid("Select a category").optional().nullable(),
  amount: z.number().positive("Amount must be positive").optional().nullable(),
  description: z.string().min(3, "Description must be at least 3 characters").max(500),
  notes: z.string().max(1000).optional().nullable(),
});

// Schema for server-side validation (FormData coercion)
export const expenseTemplateServerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  accountId: z.string().uuid("Select an account").optional().nullable(),
  categoryId: z.string().uuid("Select a category").optional().nullable(),
  amount: z.coerce.number().positive("Amount must be positive").optional().nullable(),
  description: z.string().min(3, "Description must be at least 3 characters").max(500),
  notes: z.string().max(1000).optional().nullable(),
});

export type ExpenseTemplateInput = z.infer<typeof expenseTemplateSchema>;
