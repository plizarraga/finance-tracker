import { buildCategoryInput } from "@/__tests__/data/build-category-input";
import type { CategoryInput } from "@/features/categories/schemas";

export function buildCategoryFormData(
  overrides: Partial<CategoryInput> = {}
): FormData {
  const input = buildCategoryInput(overrides);
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("type", input.type);
  return formData;
}
