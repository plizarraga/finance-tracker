export type Confirmation = {
  id: string;
  message: string;
};

export function buildConfirmation(
  overrides: Partial<Confirmation> = {}
): Confirmation {
  const base: Confirmation = {
    id: "expense-2024-02",
    message: "Expense recorded for payroll",
  };
  return { ...base, ...overrides };
}
