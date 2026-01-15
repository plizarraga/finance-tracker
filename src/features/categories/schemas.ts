import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, { error: "Name is required" }).max(100),
  type: z.enum(["income", "expense"], {
    error: (issue) =>
      issue.input === undefined ? "Type is required" : "Invalid type",
  }),
});

export type CategoryInput = z.infer<typeof categorySchema>;
