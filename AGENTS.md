# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` holds Next.js App Router pages, layouts, and API route handlers.
- `src/features/` contains domain logic per feature (accounts, categories, incomes, expenses, transfers, reports).
- `src/components/` houses shared UI components; `src/hooks/`, `src/lib/`, `src/providers/`, and `src/types/` store reusable hooks, utilities, context providers, and shared types.
- Tests live in `src/__tests__/` (unit/integration) and `e2e/` (Playwright).
- `prisma/` contains the schema and seed script; `scripts/` contains local helper scripts.
- Backend logic should live in route handlers and feature modules: use Next.js Route Handlers in `src/app/api/**/route.ts` and keep domain logic in `src/features/**`; avoid Server Actions.

## Build, Test, and Development Commands
- `pnpm dev`: start the Next.js dev server with Turbopack.
- `pnpm build`: generate Prisma client and build the app.
- `pnpm start`: run the production server.
- `pnpm lint`: run ESLint on the repo.
- `pnpm test`: run Vitest unit tests.
- `pnpm test:e2e`: reset test DB and run Playwright tests with `.env.test`.
- `pnpm test:e2e:ui`: launch the Playwright UI runner.
- `pnpm db:up` / `pnpm db:down`: start/stop local Postgres via Docker.
- `pnpm db:dev:push` and `pnpm db:seed`: apply schema and seed dev data.
- `docker compose -f docker-compose.app.yml up --build`: run the app + database via Docker.

## Coding Style & Naming Conventions
- TypeScript-first codebase; keep types explicit at module boundaries.
- Follow ESLint rules (`pnpm lint`)—no Prettier is configured.
- Use Tailwind CSS utilities for styling; keep classnames readable and grouped by layout, spacing, typography, then state.
- Use `PascalCase` for React components and `camelCase` for functions/variables.
- Keep route segments and file names in `src/app/` lowercase (Next.js conventions).

## Testing Guidelines
- Unit tests live in `src/__tests__/` and use `*.test.ts`/`*.test.tsx` naming (Vitest + Testing Library).
- E2E specs live in `e2e/` with `*.spec.ts` naming (Playwright).
- Prefer testing public APIs for features (e.g., `src/features/**/api.ts` and route handlers).

## Commit & Pull Request Guidelines
- Commit messages follow an imperative style (e.g., "Add", "Update", "Refactor", "Remove", "Enhance").
- PRs should include a short summary, testing notes (`pnpm test`, `pnpm test:e2e` if relevant), and screenshots for UI changes.

## Security & Configuration Tips
- Prisma is the source of truth for schema and queries; update `prisma/schema.prisma` first.
- Use `.env` and `.env.test` based on `.env.example`; never commit secrets.
- Ensure the test database is isolated before running `pnpm test:e2e`.

## Agent-Specific Instructions
- When implementing new functionality that depends on a third-party library, consult the Context7 MCP server first to use the latest official documentation before coding.
