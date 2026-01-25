import { buildIncomeTemplateServerInput } from "@/__tests__/data/build-income-template-server-input";
import type { IncomeTemplateServerInput } from "@/__tests__/data/build-income-template-server-input";

export function buildIncomeTemplateFormData(
  overrides: Partial<IncomeTemplateServerInput> = {}
): FormData {
  const input = buildIncomeTemplateServerInput(overrides);
  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
}
