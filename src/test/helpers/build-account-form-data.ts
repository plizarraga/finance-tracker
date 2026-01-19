type AccountFormDataInput = {
  name: string;
  description: string | null;
  initialBalance: string;
};

export function buildAccountFormData(
  overrides: Partial<AccountFormDataInput> = {}
): FormData {
  const base: AccountFormDataInput = {
    name: "Checking Account",
    description: "Primary household account",
    initialBalance: "1250",
  };
  const input = { ...base, ...overrides };
  const formData = new FormData();
  formData.set("name", input.name);
  formData.set("description", input.description ?? "");
  formData.set("initialBalance", input.initialBalance);
  return formData;
}
