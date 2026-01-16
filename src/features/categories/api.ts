import type { ActionResult } from "@/types";
import { submitForm } from "@/lib/api-client";

export function createCategory(
  formData: FormData
): Promise<ActionResult<{ id: string; name: string }>> {
  return submitForm("/api/categories", "POST", formData);
}

export function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  return submitForm(`/api/categories/${id}`, "PUT", formData);
}

export function deleteCategory(id: string): Promise<ActionResult> {
  return submitForm(`/api/categories/${id}`, "DELETE");
}
