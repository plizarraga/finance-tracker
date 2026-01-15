import { z } from "zod";

// Schema for form validation (with explicit types for react-hook-form)
export const transferSchema = z
  .object({
    fromAccountId: z.string().uuid("Select source account"),
    toAccountId: z.string().uuid("Select destination account"),
    amount: z.number().positive("Amount must be positive"),
    date: z.date(),
    description: z.string().max(500).optional().nullable(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Source and destination must be different",
    path: ["toAccountId"],
  });

// Schema for server-side validation (with coercion for FormData)
export const transferServerSchema = z
  .object({
    fromAccountId: z.string().uuid("Select source account"),
    toAccountId: z.string().uuid("Select destination account"),
    amount: z.coerce.number().positive("Amount must be positive"),
    date: z.coerce.date(),
    description: z.string().max(500).optional().nullable(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Source and destination must be different",
    path: ["toAccountId"],
  });

export type TransferInput = z.infer<typeof transferSchema>;
