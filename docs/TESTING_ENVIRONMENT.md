# Testing Environment Setup

## Environment Files

- Create `.env` and `.env.test` locally using `.env.example` as the template.
- `.env` for development
- `.env.test` for E2E testing

## Local Databases (Docker)

```bash
pnpm db:up           # Start dev/test Postgres containers
pnpm db:dev:push     # Push Prisma schema to dev database
pnpm db:test:reset   # Reset test database schema
pnpm db:seed         # Seed dev database
```

## Unit Tests (Vitest)

```bash
pnpm test            # Run all unit tests
pnpm test:watch      # Run tests in watch mode
```

Unit tests are located in `src/__tests__/` and use `*.test.ts`/`*.test.tsx` naming.

## E2E Tests (Playwright)

```bash
pnpm test:e2e        # Run E2E tests with .env.test
pnpm test:e2e:ui     # Open Playwright UI runner
```

E2E specs are located in `e2e/` and use `*.spec.ts` naming.

## Scripts Overview

| Script | Description |
|--------|-------------|
| `pnpm db:up` | Start local dev/test Postgres containers |
| `pnpm db:down` | Stop local dev/test Postgres containers |
| `pnpm db:dev:push` | Push Prisma schema to dev database using `.env` |
| `pnpm db:test:reset` | Load `.env.test`, verify test DB, reset schema |
| `pnpm db:seed` | Load `.env` and seed the dev database |
| `pnpm db:test:seed` | Load `.env.test`, verify test DB, seed it |
| `pnpm test:e2e` | Load `.env.test`, reset DB, run Playwright |
| `pnpm test:e2e:ui` | Load `.env.test`, run Playwright UI |

The E2E scripts load `.env.test` via `dotenv-cli` and verify that `DATABASE_URL` points to the local `finance_test` database before running migrations or tests.

## Railway / Production

Set `DATABASE_URL` in the Railway environment. No code changes needed.

## Test Structure

```
src/__tests__/           → Unit/integration tests (Vitest)
  ├── utils/             → Test utilities and factories
  ├── schemas/           → Schema validation tests
  └── *.test.ts          → Feature-specific tests

e2e/                     → Playwright E2E tests
  ├── fixtures/          → Test fixtures and helpers
  └── *.spec.ts          → E2E specs
```

## Best Practices

- See `docs/E2E_TESTING_RULES.md` for comprehensive E2E testing guidelines.
- Use data factories for test data generation.
- Ensure test database is isolated before running E2E tests.
- Prefer testing public APIs (route handlers, `src/features/**/api.ts`).
