# Finance Tracker

Mobile-first personal finance tracker built with Next.js (App Router), Prisma, and PostgreSQL.

## Prerequisites

- Node.js (see `.tool-versions`)
- pnpm
- Docker (for local databases)

## Local Setup

1. `pnpm install`
2. Create `.env` and `.env.test` from `.env.example`
3. `pnpm db:up`
4. `pnpm db:dev:push`
5. `pnpm db:seed`
6. `pnpm dev`

## Docker (app + database)

1. Create `.env` from `.env.docker.example`:
   ```bash
   cp .env.docker.example .env
   ```
2. Configure required variables in `.env`:
   - `POSTGRES_PASSWORD` - Database password
   - `BETTER_AUTH_SECRET` - Generate with `openssl rand -base64 32`
3. Start the stack:
   ```bash
   docker compose -f docker-compose.app.yml up --build
   ```
4. Verify health: `curl http://localhost:3000/api/health`
5. Open `http://localhost:3000`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server with Turbopack |
| `pnpm build` | Generate Prisma client and build the app |
| `pnpm start` | Run the production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest unit tests |
| `pnpm test:e2e` | Run Playwright E2E tests with `.env.test` |
| `pnpm test:e2e:ui` | Open Playwright UI with `.env.test` |
| `pnpm db:up` | Start local dev/test Postgres containers |
| `pnpm db:down` | Stop local dev/test Postgres containers |
| `pnpm db:dev:push` | Push Prisma schema to dev database using `.env` |
| `pnpm db:test:reset` | Load `.env.test`, verify test DB, reset schema |
| `pnpm db:seed` | Load `.env` and seed the dev database |
| `pnpm db:test:seed` | Load `.env.test`, verify test DB, seed it |

## Tech Stack

- Next.js App Router
- Prisma + PostgreSQL
- Better Auth
- shadcn/ui + Tailwind CSS
- Vitest + Playwright

## Documentation

- `CLAUDE.md` - Guide for Claude Code
- `AGENTS.md` - Repository guidelines for AI agents
- `docs/ARQUITECTURE.md` - System architecture
- `docs/PROJECT_SPEC.md` - Product and engineering spec
- `docs/TESTING_ENVIRONMENT.md` - Testing setup
- `docs/E2E_TESTING_RULES.md` - E2E testing best practices
- `docs/DOCKER_IMPLEMENTATION_PLAN.md` - Docker configuration details
