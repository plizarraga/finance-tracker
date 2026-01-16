import type { ActionResult } from "@/types";
import { submitForm } from "@/lib/api-client";

export function createAccount(
  formData: FormData
): Promise<ActionResult<{ id: string; name: string }>> {
  return submitForm("/api/accounts", "POST", formData);
}

export function updateAccount(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  return submitForm(`/api/accounts/${id}`, "PUT", formData);
}

export function deleteAccount(id: string): Promise<ActionResult> {
  return submitForm(`/api/accounts/${id}`, "DELETE");
}
