# Testing Environment Setup

## Environment files
- Create `.env` and `.env.test` locally using `.env.example` as the template.
- `.env` for development
- `.env.test` for e2e testing

## Local databases (Docker)
1. `pnpm db:up`
2. `pnpm db:dev:push`
3. `pnpm db:test:reset`
4. `pnpm db:seed`

## E2E tests (Playwright)
1. `pnpm test:e2e`

## Scripts overview
- `pnpm db:up`: start the local dev/test Postgres containers.
- `pnpm db:down`: stop the local dev/test Postgres containers.
- `pnpm db:dev:push`: push Prisma schema to the dev database using `.env`.
- `pnpm db:test:reset`: load `.env.test`, verify the test database, and reset schema.
- `pnpm db:seed`: load `.env` and seed the dev database.
- `pnpm db:test:seed`: load `.env.test`, verify the test database, and seed it.
- `pnpm test:e2e`: load `.env.test`, verify the test database, reset schema, then run Playwright.
- `pnpm test:e2e:ui`: load `.env.test`, verify the test database, run Playwright UI.

The e2e scripts load `.env.test` via `dotenv-cli` and verify that `DATABASE_URL` points to the
local `finance_test` database before running migrations or tests.

## Railway
Set `DATABASE_URL` in the Railway environment. No code changes needed.
