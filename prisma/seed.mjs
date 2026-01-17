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
  const email = "demo@financetracker.local";
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
        initialBalance: new Prisma.Decimal("20000.00"),
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
