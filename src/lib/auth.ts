import { betterAuth } from "better-auth";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  pgPool?: Pool;
  kyselyDb?: Kysely<unknown>;
};

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

const db =
  globalForDb.kyselyDb ??
  new Kysely({
    dialect: new PostgresDialect({
      pool,
    }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
  globalForDb.kyselyDb = db;
}

export const auth = betterAuth({
  database: {
    db,
    type: "postgres",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
