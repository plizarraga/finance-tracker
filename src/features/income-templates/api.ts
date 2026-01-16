import type { ActionResult } from "@/types";
import { submitForm, submitJson } from "@/lib/api-client";

export function createIncomeTemplate(formData: FormData): Promise<ActionResult> {
  return submitForm("/api/income-templates", "POST", formData);
}

export function updateIncomeTemplate(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  return submitForm(`/api/income-templates/${id}`, "PUT", formData);
}

export function deleteIncomeTemplate(id: string): Promise<ActionResult> {
  return submitForm(`/api/income-templates/${id}`, "DELETE");
}

export function duplicateIncomeTemplate(id: string): Promise<ActionResult> {
  return submitJson(`/api/income-templates/${id}/duplicate`, "POST");
}

export function setDefaultIncomeTemplate(
  id: string | null
): Promise<ActionResult> {
  return submitJson("/api/income-templates/default", "POST", { id });
}
