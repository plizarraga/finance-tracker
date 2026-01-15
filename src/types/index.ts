// Base types for the Finance Tracker application

// User type (managed by Better Auth)
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Account (financial account like bank account, cash, etc.)
export interface Account {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountWithBalance extends Account {
  balance: number;
}

// Category for classifying incomes and expenses
export interface Category {
  id: string;
  userId: string;
  name: string;
  type: "income" | "expense";
  createdAt: Date;
  updatedAt: Date;
}

// Income transaction
export interface Income {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncomeWithRelations extends Income {
  account: Account;
  category: Category;
}

// Expense transaction
export interface Expense {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseWithRelations extends Expense {
  account: Account;
  category: Category;
}

// Transfer between accounts
export interface Transfer {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferWithRelations extends Transfer {
  fromAccount: Account;
  toAccount: Account;
}

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

// Database row types (snake_case from Supabase)
export interface AccountRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  created_at: string;
  updated_at: string;
}

export interface IncomeRow {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseRow {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransferRow {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Utility functions to convert between row and domain types
export function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toIncome(row: IncomeRow): Income {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    categoryId: row.category_id,
    amount: row.amount,
    date: new Date(row.date),
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    categoryId: row.category_id,
    amount: row.amount,
    date: new Date(row.date),
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toTransfer(row: TransferRow): Transfer {
  return {
    id: row.id,
    userId: row.user_id,
    fromAccountId: row.from_account_id,
    toAccountId: row.to_account_id,
    amount: row.amount,
    date: new Date(row.date),
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
