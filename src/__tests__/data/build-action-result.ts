import type { ActionResult } from "@/types";

export function buildActionResult<T>(
  overrides: Partial<ActionResult<T>> = {}
): ActionResult<T> {
  const base: ActionResult<T> = { success: true };
  return { ...base, ...overrides };
}
