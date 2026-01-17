import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function dateInMonth(reference, monthOffset, day) {
  return new Date(reference.getFullYear(), reference.getMonth() + monthOffset, day);
}

async function main() {
  const email = "demo@financetracker.dev";
  const password = "DemoPass123!";
  const userId = randomUUID();
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: "Demo User", emailVerified: true },
    create: {
      id: userId,
      name: "Demo User",
      email,
      emailVerified: true,
    },
  });

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.authAccount.deleteMany({ where: { userId: user.id } }),
    prisma.transfer.deleteMany({ where: { userId: user.id } }),
    prisma.expense.deleteMany({ where: { userId: user.id } }),
    prisma.income.deleteMany({ where: { userId: user.id } }),
    prisma.transferTemplate.deleteMany({ where: { userId: user.id } }),
    prisma.expenseTemplate.deleteMany({ where: { userId: user.id } }),
    prisma.incomeTemplate.deleteMany({ where: { userId: user.id } }),
    prisma.account.deleteMany({ where: { userId: user.id } }),
    prisma.category.deleteMany({ where: { userId: user.id } }),
  ]);

  const categories = await Promise.all([
    prisma.category.create({
      data: { userId: user.id, name: "Salary", type: "income" },
    }),
    prisma.category.create({
      data: { userId: user.id, name: "Freelance", type: "income" },
    }),
    prisma.category.create({
      data: { userId: user.id, name: "Groceries", type: "expense" },
    }),
    prisma.category.create({
      data: { userId: user.id, name: "Rent", type: "expense" },
    }),
    prisma.category.create({
      data: { userId: user.id, name: "Utilities", type: "expense" },
    }),
    prisma.category.create({
      data: { userId: user.id, name: "Entertainment", type: "expense" },
    }),
  ]);

  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Cuenta Principal",
        description: "Cuenta principal",
        initialBalance: new Prisma.Decimal("100000.00"),
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Cuenta Secundaria",
        description: "Cuenta secundaria",
        initialBalance: new Prisma.Decimal("50000.00"),
      },
    }),
  ]);

  const categoryByName = new Map(categories.map((cat) => [cat.name, cat]));
  const accountByName = new Map(accounts.map((acc) => [acc.name, acc]));

  const today = new Date();
  const currentMonthSecondIncomeDay = Math.min(today.getDate(), 15);

  await prisma.income.createMany({
    data: [
      {
        userId: user.id,
        accountId: accountByName.get("Cuenta Principal").id,
        categoryId: categoryByName.get("Salary").id,
        amount: new Prisma.Decimal("6000.00"),
        date: dateInMonth(today, 0, 1),
        description: "Ingreso mensual",
      },
      {
        userId: user.id,
        accountId: accountByName.get("Cuenta Principal").id,
        categoryId: categoryByName.get("Freelance").id,
        amount: new Prisma.Decimal("4000.00"),
        date: dateInMonth(today, 0, currentMonthSecondIncomeDay),
        description: "Ingreso adicional",
      },
      {
        userId: user.id,
        accountId: accountByName.get("Cuenta Principal").id,
        categoryId: categoryByName.get("Salary").id,
        amount: new Prisma.Decimal("5000.00"),
        date: dateInMonth(today, -1, 1),
        description: "Ingreso mensual mes pasado",
      },
      {
        userId: user.id,
        accountId: accountByName.get("Cuenta Principal").id,
        categoryId: categoryByName.get("Freelance").id,
        amount: new Prisma.Decimal("4000.00"),
        date: dateInMonth(today, -1, 15),
        description: "Ingreso adicional mes pasado",
      },
    ],
  });

  const targetCount = 60;
  const extraIncomeCount = Math.max(0, targetCount - 4);
  const extraIncomeData = Array.from({ length: extraIncomeCount }, (_, index) => {
    const monthOffset = -Math.floor(index / 8);
    const day = (index % 27) + 1;
    const amountValue = 3200 + (index % 6) * 300;
    const categoryName = index % 2 === 0 ? "Salary" : "Freelance";
    const accountName =
      index % 3 === 0 ? "Cuenta Secundaria" : "Cuenta Principal";
    return {
      userId: user.id,
      accountId: accountByName.get(accountName).id,
      categoryId: categoryByName.get(categoryName).id,
      amount: new Prisma.Decimal(`${amountValue}.00`),
      date: dateInMonth(today, monthOffset, day),
      description: `Ingreso extra ${index + 1}`,
    };
  });

  if (extraIncomeData.length > 0) {
    await prisma.income.createMany({
      data: extraIncomeData,
    });
  }

  const currentMonthExpenseDays = [2, 6, 10, 14, 18, 22, 26].filter(
    (day) => day <= today.getDate()
  );
  const lastMonthExpenseDays = [3, 7, 11, 16, 21, 26];
  const currentMonthExpenses = [
    new Prisma.Decimal("900.00"),
    new Prisma.Decimal("650.00"),
    new Prisma.Decimal("1200.00"),
    new Prisma.Decimal("800.00"),
    new Prisma.Decimal("900.00"),
    new Prisma.Decimal("750.00"),
    new Prisma.Decimal("800.00"),
  ].slice(0, currentMonthExpenseDays.length);
  const lastMonthExpenses = [
    new Prisma.Decimal("900.00"),
    new Prisma.Decimal("700.00"),
    new Prisma.Decimal("1100.00"),
    new Prisma.Decimal("800.00"),
    new Prisma.Decimal("900.00"),
    new Prisma.Decimal("600.00"),
  ];

  await prisma.expense.createMany({
    data: [
      ...currentMonthExpenseDays.map((day, index) => ({
        userId: user.id,
        accountId: accountByName.get("Cuenta Principal").id,
        categoryId: categoryByName.get("Groceries").id,
        amount: currentMonthExpenses[index],
        date: dateInMonth(today, 0, day),
        description: "Gasto del mes en curso",
      })),
      ...lastMonthExpenseDays.map((day, index) => ({
        userId: user.id,
        accountId: accountByName.get("Cuenta Principal").id,
        categoryId: categoryByName.get("Rent").id,
        amount: lastMonthExpenses[index],
        date: dateInMonth(today, -1, day),
        description: "Gasto del mes pasado",
      })),
    ],
  });

  const existingExpenseCount =
    currentMonthExpenseDays.length + lastMonthExpenseDays.length;
  const extraExpenseCount = Math.max(0, targetCount - existingExpenseCount);
  const expenseCategoryNames = [
    "Groceries",
    "Utilities",
    "Entertainment",
    "Rent",
  ];
  const extraExpenseData = Array.from({ length: extraExpenseCount }, (_, index) => {
    const monthOffset = -Math.floor(index / 10);
    const day = (index % 27) + 1;
    const amountValue = 200 + (index % 7) * 85;
    const categoryName = expenseCategoryNames[index % expenseCategoryNames.length];
    const accountName =
      index % 4 === 0 ? "Cuenta Secundaria" : "Cuenta Principal";
    return {
      userId: user.id,
      accountId: accountByName.get(accountName).id,
      categoryId: categoryByName.get(categoryName).id,
      amount: new Prisma.Decimal(`${amountValue}.00`),
      date: dateInMonth(today, monthOffset, day),
      description: `Gasto extra ${index + 1}`,
    };
  });

  if (extraExpenseData.length > 0) {
    await prisma.expense.createMany({
      data: extraExpenseData,
    });
  }

  await prisma.transfer.createMany({
    data: [
      {
        userId: user.id,
        fromAccountId: accountByName.get("Cuenta Principal").id,
        toAccountId: accountByName.get("Cuenta Secundaria").id,
        amount: new Prisma.Decimal("5000.00"),
        date: daysAgo(7),
        description: "Transferencia de prueba",
      },
    ],
  });

  const extraTransferCount = Math.max(0, targetCount - 1);
  const extraTransferData = Array.from({ length: extraTransferCount }, (_, index) => {
    const amountValue = 500 + (index % 6) * 250;
    const isPrimaryToSecondary = index % 2 === 0;
    return {
      userId: user.id,
      fromAccountId: accountByName.get(
        isPrimaryToSecondary ? "Cuenta Principal" : "Cuenta Secundaria"
      ).id,
      toAccountId: accountByName.get(
        isPrimaryToSecondary ? "Cuenta Secundaria" : "Cuenta Principal"
      ).id,
      amount: new Prisma.Decimal(`${amountValue}.00`),
      date: daysAgo(index + 1),
      description: `Transferencia extra ${index + 1}`,
    };
  });

  if (extraTransferData.length > 0) {
    await prisma.transfer.createMany({
      data: extraTransferData,
    });
  }

  await prisma.incomeTemplate.create({
    data: {
      userId: user.id,
      name: "Ingreso Mensual",
      accountId: accountByName.get("Cuenta Principal").id,
      categoryId: categoryByName.get("Salary").id,
      amount: new Prisma.Decimal("6000.00"),
      description: "Ingreso mensual",
      isDefault: true,
    },
  });

  await prisma.expenseTemplate.create({
    data: {
      userId: user.id,
      name: "Gasto Mensual",
      accountId: accountByName.get("Cuenta Principal").id,
      categoryId: categoryByName.get("Rent").id,
      amount: new Prisma.Decimal("900.00"),
      description: "Gasto mensual",
      isDefault: true,
    },
  });

  await prisma.transferTemplate.create({
    data: {
      userId: user.id,
      name: "Transferencia Mensual",
      fromAccountId: accountByName.get("Cuenta Principal").id,
      toAccountId: accountByName.get("Cuenta Secundaria").id,
      amount: new Prisma.Decimal("5000.00"),
      description: "Transferencia mensual",
      isDefault: true,
    },
  });

  const passwordHash = await hashPassword(password);
  await prisma.authAccount.create({
    data: {
      id: randomUUID(),
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: passwordHash,
    },
  });

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
