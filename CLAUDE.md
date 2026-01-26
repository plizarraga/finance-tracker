# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Finance Tracker - A mobile-first personal finance web app following Simple · Lovable · Complete philosophy. Replaces Notion-based finance tracking with fast, privacy-first expense management, template-driven quick entry, and inline creation in forms.

## Tech Stack

- **Framework:** Next.js (App Router) monolith
- **Package Manager:** pnpm
- **UI:** shadcn/ui components, dark mode default
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Better Auth (JS)
- **Hosting:** Railway

## Project Structure & Module Organization

```
src/app/           → Next.js App Router pages, layouts, and API route handlers
src/features/      → Domain logic per feature (accounts, categories, incomes, expenses, transfers, reports)
src/components/    → Shared UI components
src/hooks/         → Reusable React hooks
src/lib/           → Shared utilities
src/providers/     → React context providers
src/types/         → Shared TypeScript types
src/__tests__/     → Unit/integration tests (Vitest)
e2e/               → Playwright end-to-end tests
prisma/            → Prisma schema and seed script
scripts/           → Local helper scripts
```

Each feature owns its schemas, queries, and client helpers; route handlers live in `src/app/api`.
Client calls go through `src/features/*/api.ts`, which wraps `src/app/api/**/route.ts` handlers.

Backend logic should live in route handlers and feature modules: use Next.js Route Handlers in `src/app/api/**/route.ts` and keep domain logic in `src/features/**`; avoid Server Actions.

## Build, Test, and Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server with Turbopack
pnpm build            # Generate Prisma client and build Next.js
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm test             # Run Vitest unit tests
pnpm test:e2e         # Reset test DB and run Playwright tests with .env.test
pnpm test:e2e:ui      # Launch Playwright UI runner
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:studio    # Open Prisma Studio
pnpm prisma:push      # Apply schema to the database
pnpm db:sync          # Generate Prisma client and apply schema
pnpm db:reset         # Reset database and apply schema (destructive)
pnpm db:up            # Start local Postgres containers (dev/test)
pnpm db:down          # Stop local Postgres containers (dev/test)
pnpm db:dev:push      # Push Prisma schema to dev database using .env
pnpm db:test:reset    # Reset test database
pnpm db:seed          # Seed dev database
pnpm db:test:seed     # Seed test database
pnpm db:studio        # Open Prisma Studio (alias)
```

### Docker (Full Stack)

```bash
cp .env.docker.example .env
# Configure POSTGRES_PASSWORD and BETTER_AUTH_SECRET
docker compose -f docker-compose.app.yml up --build
curl http://localhost:3000/api/health  # Verify health
```

Key Docker files:

- `Dockerfile`: Multi-stage build (base, deps, build, migrate, runner) with dumb-init for signal handling
- `docker-compose.yml`: Dev/test PostgreSQL 18-alpine databases with healthchecks
- `docker-compose.app.yml`: Full stack (db + migrate + app) with environment variables, healthchecks, restart policies
- `.env.docker.example`: Template for required Docker environment variables
- `src/app/api/health/route.ts`: Health endpoint for container orchestration

## Database

Prisma is the source of truth for schema and queries. Local dev/test can run on Docker Postgres, while production uses Railway-managed Postgres.

Update `prisma/schema.prisma` first for any schema changes; never commit secrets.

## Coding Style & Naming Conventions

- TypeScript-first codebase; keep types explicit at module boundaries.
- Follow ESLint rules (`pnpm lint`)—no Prettier is configured.
- Use Tailwind CSS utilities for styling; keep classnames readable and grouped by layout, spacing, typography, then state.
- Use `PascalCase` for React components and `camelCase` for functions/variables.
- Keep route segments and file names in `src/app/` lowercase (Next.js conventions).

## Key Design Decisions

- **Balances are calculated, not stored** - Account balance = sum of incomes - expenses ± transfers
- **Separate domain models** for incomes, expenses, and transfers (no generic "transaction" abstraction)
- **Route Handlers** for backend logic (no separate API service)
- **Reports via direct database queries** - no pre-aggregated tables
- **Mobile-first responsive design** with dedicated screens (no inline editing)
- **Templates are first-class models** for expenses, incomes, and transfers with CRUD + quick actions
- **Inline account/category creation** in income/expense/transfer forms via combobox + dialog

## Domain Models

User, Account, Category, Income, Expense, Transfer, ExpenseTemplate, IncomeTemplate, TransferTemplate - multi-user capable architecture.

## Testing Guidelines

- Unit tests live in `src/__tests__/` and use `*.test.ts`/`*.test.tsx` naming (Vitest + Testing Library).
- E2E specs live in `e2e/` with `*.spec.ts` naming (Playwright).
- Prefer testing public APIs for features (e.g., `src/features/**/api.ts` and route handlers).
- See `docs/E2E_TESTING_RULES.md` for comprehensive E2E testing best practices.
- Use `.env` and `.env.test` based on `.env.example`; ensure the test database is isolated.

## Commit & Pull Request Guidelines

- Commit messages follow an imperative style (e.g., "Add", "Update", "Refactor", "Remove", "Enhance").
- PRs should include a short summary, testing notes (`pnpm test`, `pnpm test:e2e` if relevant), and screenshots for UI changes.

## Out of Scope

Budgets, savings, goals, debts, bank integrations, AI categorization, multi-currency, financial forecasting.

## Agent-Specific Instructions

- When implementing new functionality that depends on a third-party library, consult the Context7 MCP server first to use the latest official documentation before coding.
- When using Supabase, use the Supabase MCP server tools for documentation and project management.

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.
