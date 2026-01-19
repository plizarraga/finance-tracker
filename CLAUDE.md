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

## Build Commands

```bash
pnpm install         # Install dependencies
pnpm dev             # Start dev server
pnpm build           # Generate Prisma client and build Next.js
pnpm start           # Start production server
pnpm lint            # Run ESLint
pnpm test            # Run unit tests (Vitest)
pnpm test:e2e        # Run Playwright tests with .env.test
pnpm prisma:generate # Generate Prisma client
pnpm prisma:studio   # Open Prisma Studio
pnpm prisma:push     # Apply schema to the database
pnpm db:sync         # Generate Prisma client and apply schema
pnpm db:reset        # Reset database and apply schema (destructive)
pnpm db:up           # Start local Postgres (dev/test)
pnpm db:down         # Stop local Postgres (dev/test)
pnpm db:dev:push     # Push schema to dev database
pnpm db:test:reset   # Reset test database
pnpm db:test:seed    # Seed test database
pnpm db:studio       # Open Prisma Studio (alias)
```

## Database

Prisma is the source of truth for schema and queries. Local dev/test can run on Docker Postgres, while production uses Railway-managed Postgres.

## Architecture

Monolithic Next.js with feature-based organization:

```
app/           → Routes and screens
features/      → Domain logic per feature (accounts, categories, incomes, expenses, transfers, reports)
lib/           → Shared utilities
prisma/        → Prisma schema and client
src/test/      → Unit tests, factories, helpers
```

Each feature owns its schemas, queries, and client helpers; route handlers live in `app/api`.
Client calls go through `features/*/api.ts`, which wraps `app/api/**/route.ts` handlers.

## Key Design Decisions

- **Balances are calculated, not stored** - Account balance = sum of incomes - expenses ± transfers
- **Separate domain models** for incomes, expenses, and transfers (no generic "transaction" abstraction)
- **Route Handlers** for backend logic (no separate API service)
- **Reports via direct database queries** - no pre-aggregated tables
- **Mobile-first responsive design** with dedicated screens (no inline editing)
- **Templates are first-class models** for expenses, incomes, and transfers with CRUD + quick actions
- **Inline account creation** in income/expense/transfer forms via combobox + dialog

## Domain Models

User, Account, Category, Income, Expense, Transfer, ExpenseTemplate, IncomeTemplate, TransferTemplate - multi-user capable architecture.

## Out of Scope

Budgets, savings, goals, debts, bank integrations, AI categorization, multi-currency, financial forecasting.

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.
