import { buildIncomeServerInput } from "@/__tests__/data/build-income-server-input";
import type { IncomeServerInput } from "@/__tests__/data/build-income-server-input";

export function buildIncomeFormData(
  overrides: Partial<IncomeServerInput> = {}
): FormData {
  const input = buildIncomeServerInput(overrides);
  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
}
