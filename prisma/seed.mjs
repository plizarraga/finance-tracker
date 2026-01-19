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

function dateInMonth(reference, monthOffset, day) {
  return new Date(reference.getFullYear(), reference.getMonth() + monthOffset, day);
}

function getDaysInMonth(reference, monthOffset) {
  return new Date(
    reference.getFullYear(),
    reference.getMonth() + monthOffset + 1,
    0
  ).getDate();
}

async function main() {
  const email = "john.doe@financetracker.com";
  const password = "DemoPass123!";
  const userId = randomUUID();
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: "John Doe", emailVerified: true },
    create: {
      id: userId,
      name: "John Doe",
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
      data: { userId: user.id, name: "Gas", type: "expense" },
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
  const monthOffsets = [-3, -2, -1, 0];
  const expensePlan = [
    { day: 3, category: "Rent", amount: 950 },
    { day: 7, category: "Groceries", amount: 420 },
    { day: 12, category: "Utilities", amount: 260 },
    { day: 16, category: "Gas", amount: 230 },
    { day: 21, category: "Entertainment", amount: 310 },
    { day: 26, category: "Groceries", amount: 380 },
  ];

  const incomesData = [];
  const expensesData = [];
  const transfersData = [];

  monthOffsets.forEach((monthOffset, monthIndex) => {
    const lastDay =
      monthOffset === 0 ? today.getDate() : getDaysInMonth(today, monthOffset);
    const expenseItems = expensePlan
      .filter((item) => item.day <= lastDay)
      .map((item) => ({
        ...item,
        amount: item.amount + monthIndex * 25,
      }));
    const expenseTotal = expenseItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const incomeMargin = 1500 + monthIndex * 200;
    const incomeTotal = expenseTotal + incomeMargin;
    const salaryAmount = Number((incomeTotal * 0.65).toFixed(2));
    const freelanceAmount = Number((incomeTotal - salaryAmount).toFixed(2));
    const secondIncomeDay =
      monthOffset === 0 ? Math.min(today.getDate(), 15) : 15;

    incomesData.push(
      {
        userId: user.id,
        accountId: accountByName.get("Cuenta Principal").id,
        categoryId: categoryByName.get("Salary").id,
        amount: new Prisma.Decimal(salaryAmount.toFixed(2)),
        date: dateInMonth(today, monthOffset, 1),
        description: `Ingreso mensual ${monthIndex + 1}`,
      },
      {
        userId: user.id,
        accountId: accountByName.get("Cuenta Principal").id,
        categoryId: categoryByName.get("Freelance").id,
        amount: new Prisma.Decimal(freelanceAmount.toFixed(2)),
        date: dateInMonth(today, monthOffset, secondIncomeDay),
        description: `Ingreso adicional ${monthIndex + 1}`,
      }
    );

    expenseItems.forEach((item, index) => {
      expensesData.push({
        userId: user.id,
        accountId: accountByName.get("Cuenta Principal").id,
        categoryId: categoryByName.get(item.category).id,
        amount: new Prisma.Decimal(item.amount.toFixed(2)),
        date: dateInMonth(today, monthOffset, item.day),
        description: `Gasto mensual ${monthIndex + 1}.${index + 1}`,
      });
    });

    const transferDays = [5, 20].filter((day) => day <= lastDay);
    transferDays.forEach((day, index) => {
      const isPrimaryToSecondary = index % 2 === 0;
      const transferAmount = 800 + monthIndex * 75 + index * 150;
      transfersData.push({
        userId: user.id,
        fromAccountId: accountByName.get(
          isPrimaryToSecondary ? "Cuenta Principal" : "Cuenta Secundaria"
        ).id,
        toAccountId: accountByName.get(
          isPrimaryToSecondary ? "Cuenta Secundaria" : "Cuenta Principal"
        ).id,
        amount: new Prisma.Decimal(transferAmount.toFixed(2)),
        date: dateInMonth(today, monthOffset, day),
        description: `Transferencia mensual ${monthIndex + 1}.${index + 1}`,
      });
    });
  });

  if (incomesData.length > 0) {
    await prisma.income.createMany({ data: incomesData });
  }

  if (expensesData.length > 0) {
    await prisma.expense.createMany({ data: expensesData });
  }

  if (transfersData.length > 0) {
    await prisma.transfer.createMany({ data: transfersData });
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
