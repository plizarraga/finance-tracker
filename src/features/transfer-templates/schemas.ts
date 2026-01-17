import { z } from "zod";

// Client-side schema for react-hook-form
export const transferTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  fromAccountId: z
    .string()
    .uuid("Select an account")
    .optional()
    .nullable(),
  toAccountId: z
    .string()
    .uuid("Select an account")
    .optional()
    .nullable(),
  amount: z
    .number()
    .positive("Amount must be positive")
    .optional()
    .nullable(),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters")
    .max(500),
  notes: z.string().max(1000).optional().nullable(),
});

export type TransferTemplateInput = z.infer<typeof transferTemplateSchema>;

// Server-side schema with coercion
export const transferTemplateServerSchema = z.object({
  name: z.string().min(1).max(100),
  fromAccountId: z.string().uuid().optional().nullable(),
  toAccountId: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive().optional().nullable(),
  description: z.string().min(3, "Description must be at least 3 characters").max(500),
  notes: z.string().max(1000).optional().nullable(),
});
