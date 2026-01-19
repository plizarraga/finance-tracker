const url = process.env.DATABASE_URL ?? "";

if (!url) {
  throw new Error("DATABASE_URL is required for test commands.");
}

const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1");
const isTestDb = url.includes("finance_test");

if (!isLocalhost || !isTestDb) {
  throw new Error(
    "DATABASE_URL must point to the local finance_test database for tests."
  );
}
