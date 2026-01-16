import type {
  Account,
  Category,
  Expense,
  Income,
  Prisma,
  Transfer,
  User,
  CategoryType,
} from "@prisma/client";

export type { User, Account, Category, Income, Expense, Transfer, CategoryType };

export type AccountWithBalance = Account & {
  balance: number;
};

export type IncomeWithRelations = Prisma.IncomeGetPayload<{
  include: { account: true; category: true };
}>;

export type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: { account: true; category: true };
}>;

export type TransferWithRelations = Prisma.TransferGetPayload<{
  include: { fromAccount: true; toAccount: true };
}>;

// Date range for filtering
export interface DateRange {
  from: Date;
  to: Date;
}

// Report types
export interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  accountBalances: AccountWithBalance[];
  incomeByCategory: CategoryBreakdown[];
  expenseByCategory: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
}

// Form data types
export type AccountFormData = Pick<Account, "name" | "description">;
export type CategoryFormData = Pick<Category, "name" | "type">;
export type IncomeFormData = Pick<
  Income,
  "accountId" | "categoryId" | "amount" | "date" | "description"
>;
export type ExpenseFormData = Pick<
  Expense,
  "accountId" | "categoryId" | "amount" | "date" | "description"
>;
export type TransferFormData = Pick<
  Transfer,
  "fromAccountId" | "toAccountId" | "amount" | "date" | "description"
>;

// Server action result type
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
