import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const argv = process.argv.slice(2);
const getArgValue = (flag) => {
  const idx = argv.indexOf(flag);
  if (idx === -1) return null;
  return argv[idx + 1] ?? null;
};

const dataDir =
  getArgValue("--data-dir") ??
  process.env.MIGRATION_DATA_DIR ??
  path.join(process.cwd(), "docs", "old db files", "2026");
const userId = getArgValue("--user-id") ?? process.env.MIGRATION_USER_ID;
const dryRun = argv.includes("--dry-run") || process.env.MIGRATION_DRY_RUN === "true";

if (!userId) {
  console.error("Missing --user-id or MIGRATION_USER_ID env var.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const files = {
  accounts: "accounts.csv",
  categoriesIncome: "categories - incomes.csv",
  categoriesExpense: "categories - expenses.csv",
  incomes: "incomes.csv",
  expenses: "expenses.csv",
  transfers: "transfers.csv",
};

const normalizeName = (value) => {
  if (!value) return "";
  let cleaned = value.toString().trim().replace(/^\uFEFF/, "");
  while (/\s*\(https?:\/\/[^)]*\)\s*$/.test(cleaned)) {
    cleaned = cleaned.replace(/\s*\(https?:\/\/[^)]*\)\s*$/, "");
  }
  return cleaned.trim();
};

const normalizeDescription = (value) => {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeAmount = (value) => {
  if (value == null) return null;
  let cleaned = value.toString().trim();
  if (!cleaned) return null;
  let negative = false;
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    negative = true;
    cleaned = cleaned.slice(1, -1);
  }
  cleaned = cleaned.replace(/[$,]/g, "");
  if (!cleaned) return null;
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  if (!cleaned.includes(".")) {
    cleaned = `${cleaned}.00`;
  } else {
    const [intPart, fracPart = ""] = cleaned.split(".");
    cleaned = `${intPart}.${(fracPart + "00").slice(0, 2)}`;
  }
  if (negative && !cleaned.startsWith("-")) {
    cleaned = `-${cleaned}`;
  }
  return cleaned;
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = Date.parse(value.toString().trim());
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed);
};

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === "\"" && next === "\"") {
        field += "\"";
        i += 1;
      } else if (char === "\"") {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === "\"") {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char === "\r") {
      continue;
    }
    field += char;
  }
  row.push(field);
  rows.push(row);
  return rows.filter((r) => r.some((cell) => cell && cell.trim() !== ""));
};

const parseCsvFile = async (filePath) => {
  const raw = await fs.readFile(filePath, "utf8");
  const rows = parseCsv(raw.replace(/^\uFEFF/, ""));
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => normalizeName(h));
  return rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = row[idx] ?? "";
    });
    return record;
  });
};

const loadMap = async () => {
  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({ where: { userId }, select: { id: true, name: true } }),
    prisma.category.findMany({ where: { userId }, select: { id: true, name: true, type: true } }),
  ]);
  const accountMap = new Map();
  accounts.forEach((acc) => {
    accountMap.set(normalizeName(acc.name), acc.id);
  });
  const categoryMap = new Map();
  categories.forEach((cat) => {
    categoryMap.set(`${cat.type}:${normalizeName(cat.name)}`, cat.id);
  });
  return { accountMap, categoryMap };
};

const stats = {
  accounts: { created: 0, existing: 0, skipped: 0 },
  categories: { created: 0, existing: 0, skipped: 0 },
  incomes: { created: 0, existing: 0, skipped: 0 },
  expenses: { created: 0, existing: 0, skipped: 0 },
  transfers: { created: 0, existing: 0, skipped: 0 },
};

const ensureAccount = async (accountMap, name, initialBalance = "0.00") => {
  const normalized = normalizeName(name);
  if (!normalized) return null;
  const existingId = accountMap.get(normalized);
  if (existingId) return existingId;
  if (dryRun) {
    const placeholder = `dry-${normalized}`;
    accountMap.set(normalized, placeholder);
    return placeholder;
  }
  const created = await prisma.account.create({
    data: {
      userId,
      name: normalized,
      initialBalance: new Prisma.Decimal(initialBalance),
    },
  });
  accountMap.set(normalized, created.id);
  stats.accounts.created += 1;
  return created.id;
};

const ensureCategory = async (categoryMap, name, type) => {
  const normalized = normalizeName(name);
  if (!normalized) return null;
  const key = `${type}:${normalized}`;
  const existingId = categoryMap.get(key);
  if (existingId) return existingId;
  if (dryRun) {
    const placeholder = `dry-${key}`;
    categoryMap.set(key, placeholder);
    return placeholder;
  }
  const created = await prisma.category.create({
    data: {
      userId,
      name: normalized,
      type,
    },
  });
  categoryMap.set(key, created.id);
  stats.categories.created += 1;
  return created.id;
};

const importAccounts = async (accountMap) => {
  const rows = await parseCsvFile(path.join(dataDir, files.accounts));
  for (const row of rows) {
    const name = normalizeName(row["Name"]);
    if (!name) {
      stats.accounts.skipped += 1;
      continue;
    }
    if (accountMap.has(name)) {
      stats.accounts.existing += 1;
      continue;
    }
    const amount = normalizeAmount(row["Starting Balance"]) ?? "0.00";
    await ensureAccount(accountMap, name, amount);
  }
};

const importCategories = async (categoryMap) => {
  const incomeRows = await parseCsvFile(path.join(dataDir, files.categoriesIncome));
  const expenseRows = await parseCsvFile(path.join(dataDir, files.categoriesExpense));
  for (const row of incomeRows) {
    const name = normalizeName(row["Name"]);
    if (!name) {
      stats.categories.skipped += 1;
      continue;
    }
    const key = `income:${name}`;
    if (categoryMap.has(key)) {
      stats.categories.existing += 1;
      continue;
    }
    await ensureCategory(categoryMap, name, "income");
  }
  for (const row of expenseRows) {
    const name = normalizeName(row["Name"]);
    if (!name) {
      stats.categories.skipped += 1;
      continue;
    }
    const key = `expense:${name}`;
    if (categoryMap.has(key)) {
      stats.categories.existing += 1;
      continue;
    }
    await ensureCategory(categoryMap, name, "expense");
  }
};

const importIncomes = async (accountMap, categoryMap) => {
  const rows = await parseCsvFile(path.join(dataDir, files.incomes));
  for (const row of rows) {
    const description = normalizeName(row["Name"]);
    const categoryName = normalizeName(row["Source"]);
    const accountName = normalizeName(row["Account"]);
    const amount = normalizeAmount(row["Amount"]);
    const date = parseDate(row["Date"]);
    if (!description || !categoryName || !accountName || !amount || !date) {
      stats.incomes.skipped += 1;
      continue;
    }
    const accountId = await ensureAccount(accountMap, accountName);
    const categoryId = await ensureCategory(categoryMap, categoryName, "income");
    if (!accountId || !categoryId) {
      stats.incomes.skipped += 1;
      continue;
    }
    if (!dryRun) {
      const existing = await prisma.income.findFirst({
        where: { userId, accountId, categoryId, amount, date, description },
        select: { id: true },
      });
      if (existing) {
        stats.incomes.existing += 1;
        continue;
      }
      await prisma.income.create({
        data: {
          userId,
          accountId,
          categoryId,
          amount,
          date,
          description,
          descriptionNormalized: normalizeDescription(description),
        },
      });
    }
    stats.incomes.created += 1;
  }
};

const importExpenses = async (accountMap, categoryMap) => {
  const rows = await parseCsvFile(path.join(dataDir, files.expenses));
  for (const row of rows) {
    const description = normalizeName(row["Name"]);
    const categoryName = normalizeName(row["Category"]);
    const accountName = normalizeName(row["Account"]);
    const amount = normalizeAmount(row["Amount"]);
    const date = parseDate(row["Date"]);
    if (!description || !categoryName || !accountName || !amount || !date) {
      stats.expenses.skipped += 1;
      continue;
    }
    const accountId = await ensureAccount(accountMap, accountName);
    const categoryId = await ensureCategory(categoryMap, categoryName, "expense");
    if (!accountId || !categoryId) {
      stats.expenses.skipped += 1;
      continue;
    }
    if (!dryRun) {
      const existing = await prisma.expense.findFirst({
        where: { userId, accountId, categoryId, amount, date, description },
        select: { id: true },
      });
      if (existing) {
        stats.expenses.existing += 1;
        continue;
      }
      await prisma.expense.create({
        data: {
          userId,
          accountId,
          categoryId,
          amount,
          date,
          description,
          descriptionNormalized: normalizeDescription(description),
        },
      });
    }
    stats.expenses.created += 1;
  }
};

const importTransfers = async (accountMap) => {
  const rows = await parseCsvFile(path.join(dataDir, files.transfers));
  for (const row of rows) {
    const description = normalizeName(row["Name"]);
    const fromName = normalizeName(row["Transfer From"]);
    const toName = normalizeName(row["Transfer To"]);
    const amount = normalizeAmount(row["Amount"]);
    const date = parseDate(row["Date"]);
    if (!description || !fromName || !toName || !amount || !date) {
      stats.transfers.skipped += 1;
      continue;
    }
    const fromAccountId = await ensureAccount(accountMap, fromName);
    const toAccountId = await ensureAccount(accountMap, toName);
    if (!fromAccountId || !toAccountId) {
      stats.transfers.skipped += 1;
      continue;
    }
    if (!dryRun) {
      const existing = await prisma.transfer.findFirst({
        where: { userId, fromAccountId, toAccountId, amount, date, description },
        select: { id: true },
      });
      if (existing) {
        stats.transfers.existing += 1;
        continue;
      }
      await prisma.transfer.create({
        data: {
          userId,
          fromAccountId,
          toAccountId,
          amount,
          date,
          description,
          descriptionNormalized: normalizeDescription(description),
        },
      });
    }
    stats.transfers.created += 1;
  }
};

const main = async () => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    console.error(`User not found: ${userId}`);
    process.exit(1);
  }

  const { accountMap, categoryMap } = await loadMap();
  await importAccounts(accountMap);
  await importCategories(categoryMap);
  await importIncomes(accountMap, categoryMap);
  await importExpenses(accountMap, categoryMap);
  await importTransfers(accountMap);

  console.log(`Legacy import ${dryRun ? "(dry-run) " : ""}complete.`);
  console.table(stats);
};

main()
  .catch((error) => {
    console.error("Legacy import failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
