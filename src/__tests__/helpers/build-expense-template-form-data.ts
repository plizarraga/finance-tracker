import { buildExpenseTemplateServerInput } from "@/__tests__/data/build-expense-template-server-input";
import type { ExpenseTemplateServerInput } from "@/__tests__/data/build-expense-template-server-input";

export function buildExpenseTemplateFormData(
  overrides: Partial<ExpenseTemplateServerInput> = {}
): FormData {
  const input = buildExpenseTemplateServerInput(overrides);
  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
}
