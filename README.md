# Finance Tracker

Mobile-first personal finance tracker built with Next.js (App Router), Prisma, and PostgreSQL.

## Prerequisites
- Node.js (see `.tool-versions`)
- pnpm
- Docker (for local databases)

## Local setup
1. `pnpm install`
2. Create `.env` and `.env.test` from `.env.example`
3. `pnpm db:up`
4. `pnpm db:dev:push`
5. `pnpm db:seed`
6. `pnpm dev`

## Docker (app + database)
1. Create `.env` from `.env.example` and set `BETTER_AUTH_SECRET`.
2. `docker compose -f docker-compose.app.yml up --build`
3. Open `http://localhost:3000`

## Scripts
- `pnpm dev`: start the Next.js dev server.
- `pnpm build`: generate Prisma client and build the app.
- `pnpm start`: run the production server.
- `pnpm lint`: run ESLint.
- `pnpm test`: run unit tests (Vitest).
- `pnpm test:e2e`: run Playwright e2e tests using `.env.test`.
- `pnpm test:e2e:ui`: open Playwright UI using `.env.test`.
- `pnpm db:up`: start local dev/test Postgres containers.
- `pnpm db:down`: stop local dev/test Postgres containers.
- `pnpm db:dev:push`: push Prisma schema to the dev database using `.env`.
- `pnpm db:test:reset`: load `.env.test`, verify the test DB, reset schema.
- `pnpm db:seed`: load `.env` and seed the dev database.
- `pnpm db:test:seed`: load `.env.test`, verify the test DB, seed it.

## Tech stack
- Next.js App Router
- Prisma + PostgreSQL
- Better Auth
- Vitest + Playwright
