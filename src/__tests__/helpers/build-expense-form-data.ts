import { buildExpenseServerInput } from "@/__tests__/data/build-expense-server-input";
import type { ExpenseServerInput } from "@/__tests__/data/build-expense-server-input";

export function buildExpenseFormData(
  overrides: Partial<ExpenseServerInput> = {}
): FormData {
  const input = buildExpenseServerInput(overrides);
  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
}
