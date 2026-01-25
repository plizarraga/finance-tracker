import { Prisma } from "@prisma/client";

import { buildAccountWithBalance } from "@/__tests__/data/build-account-with-balance";
import { buildCategory } from "@/__tests__/data/build-category";
import { buildCategoryBreakdown } from "@/__tests__/data/build-category-breakdown";
import { buildGroupedCategorySum } from "@/__tests__/data/build-grouped-category-sum";
import { buildMonthlyRow } from "@/__tests__/data/build-monthly-row";
import type { DateRange, ReportSummary, CategoryBreakdown } from "@/types";

export type CategoryScenario = {
  userId: string;
  dateRange: DateRange;
  grouped: ReturnType<typeof buildGroupedCategorySum>[];
  categories: ReturnType<typeof buildCategory>[];
  expected: CategoryBreakdown[];
};

export type ReportSummaryScenario = {
  userId: string;
  dateRange: DateRange;
  accountBalances: ReturnType<typeof buildAccountWithBalance>[];
  incomeGrouped: ReturnType<typeof buildGroupedCategorySum>[];
  expenseGrouped: ReturnType<typeof buildGroupedCategorySum>[];
  categories: ReturnType<typeof buildCategory>[];
  expected: ReportSummary;
};

export type MonthlyTrendsScenario = {
  userId: string;
  months: number;
  incomeRows: ReturnType<typeof buildMonthlyRow>[];
  expenseRows: ReturnType<typeof buildMonthlyRow>[];
  expected: { month: string; income: number; expenses: number }[];
};

export function buildReportSummaryScenario(): ReportSummaryScenario {
  const dateRange = {
    from: new Date("2024-02-01T00:00:00.000Z"),
    to: new Date("2024-02-29T00:00:00.000Z"),
  };
  const incomePrimary = buildGroupedCategorySum({
    categoryId: "category-101",
    _sum: { amount: new Prisma.Decimal(300) },
  });
  const incomeSecondary = buildGroupedCategorySum({
    categoryId: "category-102",
    _sum: { amount: new Prisma.Decimal(100) },
  });
  const expensePrimary = buildGroupedCategorySum({
    categoryId: "category-201",
    _sum: { amount: new Prisma.Decimal(150) },
  });
  const expenseSecondary = buildGroupedCategorySum({
    categoryId: "category-202",
    _sum: { amount: new Prisma.Decimal(50) },
  });
  const incomeTotal =
    (incomePrimary._sum.amount?.toNumber() ?? 0) +
    (incomeSecondary._sum.amount?.toNumber() ?? 0);
  const expenseTotal =
    (expensePrimary._sum.amount?.toNumber() ?? 0) +
    (expenseSecondary._sum.amount?.toNumber() ?? 0);
  const categories = [
    buildCategory({ id: "category-101", name: "Salary", type: "income" }),
    buildCategory({ id: "category-102", name: "Bonus", type: "income" }),
    buildCategory({ id: "category-201", name: "Rent", type: "expense" }),
    buildCategory({ id: "category-202", name: "Utilities", type: "expense" }),
  ];
  const accountBalances = [
    buildAccountWithBalance({ id: "account-101", balance: 300 }),
    buildAccountWithBalance({ id: "account-102", balance: 500 }),
  ];

  return {
    userId: "user-203",
    dateRange,
    accountBalances,
    incomeGrouped: [incomePrimary, incomeSecondary],
    expenseGrouped: [expensePrimary, expenseSecondary],
    categories,
    expected: {
      totalIncome: incomeTotal,
      totalExpenses: expenseTotal,
      netBalance: incomeTotal - expenseTotal,
      accountBalances,
      incomeByCategory: [
        buildCategoryBreakdown({
          categoryId: incomePrimary.categoryId,
          categoryName: categories[0].name,
          total: incomePrimary._sum.amount?.toNumber() ?? 0,
          percentage: incomeTotal
            ? ((incomePrimary._sum.amount?.toNumber() ?? 0) / incomeTotal) * 100
            : 0,
        }),
        buildCategoryBreakdown({
          categoryId: incomeSecondary.categoryId,
          categoryName: categories[1].name,
          total: incomeSecondary._sum.amount?.toNumber() ?? 0,
          percentage: incomeTotal
            ? ((incomeSecondary._sum.amount?.toNumber() ?? 0) / incomeTotal) * 100
            : 0,
        }),
      ],
      expenseByCategory: [
        buildCategoryBreakdown({
          categoryId: expensePrimary.categoryId,
          categoryName: categories[2].name,
          total: expensePrimary._sum.amount?.toNumber() ?? 0,
          percentage: expenseTotal
            ? ((expensePrimary._sum.amount?.toNumber() ?? 0) / expenseTotal) * 100
            : 0,
        }),
        buildCategoryBreakdown({
          categoryId: expenseSecondary.categoryId,
          categoryName: categories[3].name,
          total: expenseSecondary._sum.amount?.toNumber() ?? 0,
          percentage: expenseTotal
            ? ((expenseSecondary._sum.amount?.toNumber() ?? 0) / expenseTotal) * 100
            : 0,
        }),
      ],
    },
  };
}

export function buildIncomeByCategoryScenario(): CategoryScenario {
  const dateRange = {
    from: new Date("2024-02-01T00:00:00.000Z"),
    to: new Date("2024-02-29T00:00:00.000Z"),
  };
  const primary = buildGroupedCategorySum({
    categoryId: "category-101",
    _sum: { amount: new Prisma.Decimal(300) },
  });
  const secondary = buildGroupedCategorySum({
    categoryId: "category-102",
    _sum: { amount: new Prisma.Decimal(100) },
  });
  const total =
    (primary._sum.amount?.toNumber() ?? 0) +
    (secondary._sum.amount?.toNumber() ?? 0);
  const categories = [
    buildCategory({ id: "category-101", name: "Salary", type: "income" }),
    buildCategory({ id: "category-102", name: "Bonus", type: "income" }),
  ];

  return {
    userId: "user-203",
    dateRange,
    grouped: [primary, secondary],
    categories,
    expected: [
      buildCategoryBreakdown({
        categoryId: primary.categoryId,
        categoryName: categories[0].name,
        total: primary._sum.amount?.toNumber() ?? 0,
        percentage: total
          ? ((primary._sum.amount?.toNumber() ?? 0) / total) * 100
          : 0,
      }),
      buildCategoryBreakdown({
        categoryId: secondary.categoryId,
        categoryName: categories[1].name,
        total: secondary._sum.amount?.toNumber() ?? 0,
        percentage: total
          ? ((secondary._sum.amount?.toNumber() ?? 0) / total) * 100
          : 0,
      }),
    ],
  };
}

export function buildExpenseByCategoryScenario(): CategoryScenario {
  const dateRange = {
    from: new Date("2024-02-01T00:00:00.000Z"),
    to: new Date("2024-02-29T00:00:00.000Z"),
  };
  const primary = buildGroupedCategorySum({
    categoryId: "category-201",
    _sum: { amount: new Prisma.Decimal(150) },
  });
  const secondary = buildGroupedCategorySum({
    categoryId: "category-202",
    _sum: { amount: new Prisma.Decimal(50) },
  });
  const total =
    (primary._sum.amount?.toNumber() ?? 0) +
    (secondary._sum.amount?.toNumber() ?? 0);
  const categories = [
    buildCategory({ id: "category-201", name: "Rent", type: "expense" }),
    buildCategory({ id: "category-202", name: "Utilities", type: "expense" }),
  ];

  return {
    userId: "user-203",
    dateRange,
    grouped: [primary, secondary],
    categories,
    expected: [
      buildCategoryBreakdown({
        categoryId: primary.categoryId,
        categoryName: categories[0].name,
        total: primary._sum.amount?.toNumber() ?? 0,
        percentage: total
          ? ((primary._sum.amount?.toNumber() ?? 0) / total) * 100
          : 0,
      }),
      buildCategoryBreakdown({
        categoryId: secondary.categoryId,
        categoryName: categories[1].name,
        total: secondary._sum.amount?.toNumber() ?? 0,
        percentage: total
          ? ((secondary._sum.amount?.toNumber() ?? 0) / total) * 100
          : 0,
      }),
    ],
  };
}

export function buildMonthlyTrendsScenario(): MonthlyTrendsScenario {
  return {
    userId: "user-203",
    months: 2,
    incomeRows: [
      buildMonthlyRow({ month: "2024-02", total: new Prisma.Decimal(100) }),
      buildMonthlyRow({ month: "2024-03", total: new Prisma.Decimal(200) }),
    ],
    expenseRows: [
      buildMonthlyRow({ month: "2024-03", total: new Prisma.Decimal(50) }),
    ],
    expected: [
      { month: "2024-02", income: 100, expenses: 0 },
      { month: "2024-03", income: 200, expenses: 50 },
    ],
  };
}
