import type { ActionResult } from "@/types";
import { submitForm } from "@/lib/api-client";

export function createTransfer(formData: FormData): Promise<ActionResult> {
  return submitForm("/api/transfers", "POST", formData);
}

export function updateTransfer(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  return submitForm(`/api/transfers/${id}`, "PUT", formData);
}

export function deleteTransfer(id: string): Promise<ActionResult> {
  return submitForm(`/api/transfers/${id}`, "DELETE");
}
