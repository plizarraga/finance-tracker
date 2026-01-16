import type { ActionResult } from "@/types";
import { submitForm, submitJson } from "@/lib/api-client";

export function createExpenseTemplate(
  formData: FormData
): Promise<ActionResult> {
  return submitForm("/api/expense-templates", "POST", formData);
}

export function updateExpenseTemplate(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  return submitForm(`/api/expense-templates/${id}`, "PUT", formData);
}

export function deleteExpenseTemplate(id: string): Promise<ActionResult> {
  return submitForm(`/api/expense-templates/${id}`, "DELETE");
}

export function duplicateExpenseTemplate(id: string): Promise<ActionResult> {
  return submitJson(`/api/expense-templates/${id}/duplicate`, "POST");
}

export function setDefaultExpenseTemplate(
  id: string | null
): Promise<ActionResult> {
  return submitJson("/api/expense-templates/default", "POST", { id });
}
