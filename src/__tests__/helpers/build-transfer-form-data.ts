import { buildTransferServerInput } from "@/__tests__/data/build-transfer-server-input";
import type { TransferServerInput } from "@/__tests__/data/build-transfer-server-input";

export function buildTransferFormData(
  overrides: Partial<TransferServerInput> = {}
): FormData {
  const input = buildTransferServerInput(overrides);
  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
}
