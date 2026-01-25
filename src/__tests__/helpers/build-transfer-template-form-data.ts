import { buildTransferTemplateServerInput } from "@/__tests__/data/build-transfer-template-server-input";
import type { TransferTemplateServerInput } from "@/__tests__/data/build-transfer-template-server-input";

export function buildTransferTemplateFormData(
  overrides: Partial<TransferTemplateServerInput> = {}
): FormData {
  const input = buildTransferTemplateServerInput(overrides);
  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
}
