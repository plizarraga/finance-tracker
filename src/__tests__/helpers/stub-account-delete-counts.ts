type CountMock = {
  mockResolvedValue: (value: number) => unknown;
};

type TransferCountMock = {
  mockResolvedValueOnce: (value: number) => TransferCountMock;
};

type DeleteCounts = {
  incomes: number;
  expenses: number;
  transfersFrom: number;
  transfersTo: number;
};

export function stubAccountDeleteCounts(
  incomeCountMock: CountMock,
  expenseCountMock: CountMock,
  transferCountMock: TransferCountMock,
  counts: DeleteCounts
) {
  incomeCountMock.mockResolvedValue(counts.incomes);
  expenseCountMock.mockResolvedValue(counts.expenses);
  transferCountMock
    .mockResolvedValueOnce(counts.transfersFrom)
    .mockResolvedValueOnce(counts.transfersTo);
}
