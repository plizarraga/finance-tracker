# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Finance Tracker SLC - A mobile-first personal finance web app following Simple · Lovable · Complete philosophy. Replaces Notion-based finance tracking with fast, privacy-first expense management.

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
pnpm prisma:generate # Generate Prisma client
pnpm prisma:studio   # Open Prisma Studio
pnpm prisma:push     # Apply schema to the database
pnpm db:sync         # Generate Prisma client and apply schema
pnpm db:reset        # Reset database and apply schema (destructive)
pnpm db:studio       # Open Prisma Studio (alias)
```

## Database

Prisma is the source of truth for schema and queries. The Prisma client is generated on build and can be refreshed locally with `pnpm prisma:generate`.

## Architecture

Monolithic Next.js with feature-based organization:

```
app/           → Routes and screens
features/      → Domain logic per feature (accounts, categories, incomes, expenses, transfers, reports)
lib/           → Shared utilities
prisma/        → Prisma schema and client
```

Each feature owns its server actions, queries, and validation.

## Key Design Decisions

- **Balances are calculated, not stored** - Account balance = sum of incomes - expenses ± transfers
- **Separate domain models** for incomes, expenses, and transfers (no generic "transaction" abstraction)
- **Server Actions / Route Handlers** for backend logic (no separate API service)
- **Reports via direct database queries** - no pre-aggregated tables
- **Mobile-first responsive design** with dedicated screens (no inline editing)

## Domain Models

User, Account, Category, Income, Expense, Transfer - multi-user capable architecture.

## Out of Scope

Budgets, savings, goals, debts, bank integrations, AI categorization, multi-currency, financial forecasting.
