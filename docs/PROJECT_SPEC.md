# PRODUCT SPEC — Finance Tracker SLC

## Overview

**Product Name (working):** Finance Tracker SLC
**Philosophy:** Simple · Lovable · Complete
**Primary Goal:** Replace a Notion-based personal finance workflow with a fast, mobile-first web app that can later scale and monetize.

---

# Part 1 — Product Requirement Document (PRD)

## 1. Product Purpose

A manual, privacy-first personal finance tracker designed for daily use. The product prioritizes speed, clarity, and excellent UX over complex financial features.

The app exists to answer one core question quickly:

> “Where is my money going, and what is my current balance?”

---

## 2. Target User

### Primary User

- Individual user (initially the creator)
- Tech-savvy
- Tracks expenses daily
- Uses mobile and desktop interchangeably
- Values speed, clarity, and control over automation

### Usage Context

- Mobile-first usage for daily expense entry
- Desktop usage for reviewing reports and balances

---

## 3. Problems This Product Solves

Current finance apps fail because they are:

- Overloaded with unused features
- Click-heavy and slow
- Poorly designed for mobile
- Weak in UI/UX quality
- Unclear or untrusted regarding data privacy

**Core pain point:**

> “I cannot register and review my finances quickly and clearly without friction.”

---

## 4. Product Principles (SLC)

### Simple

- No budgets, goals, debts, savings, or financial planning tools
- Manual data entry only
- Clear mental model: accounts, money in, money out
- Minimal screens and interactions

### Lovable

- Fast interactions
- Smooth, responsive UI
- Clean and modern design
- Dark mode enabled from day one

### Complete

The product is considered _complete_ when it can fully replace Notion for personal finance tracking, including:

- Account management
- Income and expense tracking
- Transfers between accounts
- Clear balances and reports

---

## 5. Scope & Milestones

### MVP (Core Replacement for Notion)

**User Model**

- Authentication included (minimal but production-ready)
- Single-user focus, but multi-user capable architecture

**Core Modules**

- Accounts
- Categories (income & expense)
- Incomes
- Expenses
- Transfers between accounts
- Templates (income, expense, transfer)
- Reports

  - Totals (income, expenses)
  - Account balances
  - Category breakdowns
  - Date range filtering
  - Graphs

**UX Decisions**

- Simple forms
- Dedicated screens (no inline editing)
- Mobile-first responsive design
- Dark mode by default

---

### V1 (Productivity & Quality Improvements)

- UI/UX refinements
- Performance optimizations
- Better reporting views
- Improved filtering and grouping
- Inline account creation and selection in transaction forms

---

### V2 (Efficiency & Reuse)

- Templates for incomes, expenses, and transfers (CRUD + quick actions)
- Ability to duplicate templates
- Recurring expenses
- Ability to duplicate recurring expenses

---

### Later (Explicitly Out of Scope for Now)

- Budgets
- Savings
- Goals
- Debts / loans
- Bank integrations
- AI categorization or automation

---

## 6. Non-Goals (Not In Scope)

These features are intentionally excluded to preserve SLC:

- Financial forecasting
- Automated bank syncing
- Advanced accounting concepts
- Multi-currency (initially)

---

# Part 2 — Engineering Design Document (EDD)

## 7. Tech Stack (Confirmed)

### Application Type

- **Next.js Monolith**
- App Router
- Single codebase serving UI and backend logic

### Frontend

- Next.js (React)
- **shadcn/ui** for UI components
- Mobile-first responsive design
- Dark mode enabled by default
- Simple forms on dedicated screens

### Backend

- Next.js route handlers (App Router API routes)
- No separate backend service
- **pnpm** as JavaScript package manager

### Database

- **PostgreSQL (Supabase) + Prisma ORM**
- Relational schema
- Prisma as source of truth for schema and queries

### Authentication

- **Better Auth (JS)**
- Minimal, production-ready authentication from MVP
- Multi-user capable from day one

### Hosting & Infra

- **Railway** for deployment
- **pnpm** used in local development and CI
- Environment-based configuration

---

## 8. Architecture Overview

**Monolithic Next.js architecture:**

- UI (App Router pages)
- Route Handlers (API Routes)
- Database (PostgreSQL via Prisma)

Key characteristics:

- Simple mental model
- Fewer moving parts
- Easy local development
- Scales to multi-user SaaS later

---

## 9. Domain & Data Model (MVP)

### Core Models

- User
- Account
- Category
- Income
- Expense
- Transfer
- ExpenseTemplate
- IncomeTemplate
- TransferTemplate

**Design choice:**

- Separate domain models for incomes, expenses, and transfers
- Clear semantics over clever abstractions

---

## 10. Balance Strategy

- **Balances are calculated**, not stored
- Account balance = sum of related incomes, expenses, and transfers

Benefits:

- Single source of truth
- No risk of desynchronization
- Easier to reason about

---

## 11. Reporting & Queries

- Reports generated via **direct database queries**
- No pre-aggregated tables in MVP
- Date range and category filters handled at query level

### Graphs

- Generated from queried data
- Rendered in frontend using standard chart libraries compatible with React

---

## 12. Data Flow (MVP)

1. User authenticates via Better Auth
2. User creates accounts and categories (inline creation supported in forms)
3. User optionally creates templates (expense/income/transfer)
4. User registers:

   - Income
   - Expense
   - Transfer

5. Data is persisted in PostgreSQL via Prisma
6. Balances and reports are computed on read
7. UI renders summaries, charts, and template quick actions

---

## 13. API & Server Design

- No public API initially
- Internal data access via route handlers

Design principles:

- Explicit, predictable functions
- No hidden side effects

### Client ↔ Route Handler Boundary

- `features/*/api.ts` is the client wrapper for route handlers.
- `app/api/**/route.ts` owns validation, auth, and data mutations.
- This split keeps UI code stable and enables future backend migration by swapping the client layer.

---

## 14. Security & Privacy

- Secrets managed via environment variables
- Encrypted credentials
- HTTPS in production
- Privacy-first by design

---

## 15. Logging & Observability

- Basic application logs only (MVP)
- Focus on debugging, not full observability
- Upgrade path to error tracking later

---

## 16. Project Structure (Next.js Best Practice)

**Feature-based structure:**

- `app/` — routes and screens
- `features/` — domain logic per feature (schemas, queries, client helpers)

  - accounts
  - categories
  - incomes
  - expenses
  - transfers
  - reports
  - expense-templates
  - income-templates
  - transfer-templates

- `lib/` — shared utilities
- `prisma/` — Prisma schema and client

Each feature owns:

- Server actions
- Queries
- Validation

---

## 17. Tooling & Runtime

- **pnpm** as package manager
- `pnpm install` installs dependencies
- `pnpm dev` starts the development server
- `pnpm build` generates the Prisma client and builds Next.js
- `pnpm start` starts the production server
- `pnpm lint` runs ESLint
- `pnpm prisma:generate` generates the Prisma client
- `pnpm prisma:studio` opens Prisma Studio
- `pnpm prisma:push` applies the schema to the database
- `pnpm db:sync` generates the Prisma client and applies the schema
- `pnpm db:reset` resets the database and applies the schema (destructive)
- `pnpm db:studio` alias for Prisma Studio
- Deterministic installs via lockfile

---

## 18. Engineering Principles

- Simplicity over abstraction
- Minimal indirection
- Clear naming
- Small, safe changes

---

## 18. Deployment Strategy

- Railway for all environments
- Supabase-managed Postgres database (Prisma-managed schema)
- Environment-based configs

---

**Status:** Active development — Prisma migration complete, templates and inline creation shipped
