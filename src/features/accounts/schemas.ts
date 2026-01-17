import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  initialBalance: z.number().min(0, "Initial balance cannot be negative"),
});

export const accountServerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  initialBalance: z.coerce
    .number()
    .min(0, "Initial balance cannot be negative"),
});

export type AccountInput = z.infer<typeof accountSchema>;
