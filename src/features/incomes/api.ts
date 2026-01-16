import type { ActionResult } from "@/types";
import { submitForm } from "@/lib/api-client";

export function createIncome(formData: FormData): Promise<ActionResult> {
  return submitForm("/api/incomes", "POST", formData);
}

export function updateIncome(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  return submitForm(`/api/incomes/${id}`, "PUT", formData);
}

export function deleteIncome(id: string): Promise<ActionResult> {
  return submitForm(`/api/incomes/${id}`, "DELETE");
}
