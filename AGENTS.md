# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` hosts the Next.js App Router pages, layouts, and API routes (`src/app/api/*/route.ts`).
- `src/components/` contains reusable UI and feature components (forms, tables, charts).
- `src/features/` groups domain logic by feature (schemas, queries, API wrappers).
- `src/lib/` contains shared helpers (auth, formatting, API clients).
- `prisma/` contains the database schema, migrations, and seed script.
- `docs/` includes implementation plans and architecture notes.

## Build, Test, and Development Commands
- `pnpm dev`: start the Next.js dev server (Turbopack).
- `pnpm build`: generate Prisma client and build the app.
- `pnpm start`: run the production server from the build output.
- `pnpm lint`: run ESLint with Next.js rules.
- `pnpm db:sync`: generate Prisma client and push schema to the DB.
- `pnpm db:seed`: seed the database (`prisma/seed.mjs`).
- `pnpm db:studio`: open Prisma Studio for data inspection.

## Coding Style & Naming Conventions
- TypeScript/React with 2-space indentation and double quotes, as in existing `src/**/*.tsx`.
- Follow Next.js + ESLint Core Web Vitals rules (`eslint.config.mjs`).
- Prefer file- and folder-based routing patterns under `src/app/`.
- Component files use kebab-case (e.g., `expense-columns.tsx`).

## Testing Guidelines
- No automated test framework is configured in this repo.
- Use manual verification and targeted page checks; start with `pnpm dev` and validate key flows.
- If adding tests, align with the feature folder layout in `src/features/`.

## Commit & Pull Request Guidelines
- Recent commits use imperative, short summaries (e.g., “Update ReportsPage…”, “Refactor financial pages…”).
- Keep commits focused and describe the impact on UI/data flows.
- PRs should include a concise summary, testing notes (manual steps), and screenshots for UI changes.

## Security & Configuration Tips
- Database access is handled through Prisma with a PostgreSQL datasource (`prisma/schema.prisma`).
- Keep environment configuration out of source control; document required variables in PRs when added.
