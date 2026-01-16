import type { ActionResult } from "@/types";
import { submitForm, submitJson } from "@/lib/api-client";

export function createTransferTemplate(
  formData: FormData
): Promise<ActionResult> {
  return submitForm("/api/transfer-templates", "POST", formData);
}

export function updateTransferTemplate(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  return submitForm(`/api/transfer-templates/${id}`, "PUT", formData);
}

export function deleteTransferTemplate(id: string): Promise<ActionResult> {
  return submitForm(`/api/transfer-templates/${id}`, "DELETE");
}

export function duplicateTransferTemplate(id: string): Promise<ActionResult> {
  return submitJson(`/api/transfer-templates/${id}/duplicate`, "POST");
}

export function setDefaultTransferTemplate(
  id: string | null
): Promise<ActionResult> {
  return submitJson("/api/transfer-templates/default", "POST", { id });
}
