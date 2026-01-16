import type { ActionResult } from "@/types";
import { submitForm } from "@/lib/api-client";

export function createExpense(formData: FormData): Promise<ActionResult> {
  return submitForm("/api/expenses", "POST", formData);
}

export function updateExpense(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  return submitForm(`/api/expenses/${id}`, "PUT", formData);
}

export function deleteExpense(id: string): Promise<ActionResult> {
  return submitForm(`/api/expenses/${id}`, "DELETE");
}
