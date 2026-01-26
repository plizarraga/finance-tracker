# Plan: Docker Refactoring - Finance Tracker

## Summary

Refactored Docker configuration to apply best practices, improve performance, and enhance workflow.

## Issues Addressed

| Issue                                  | File                          | Impact                      |
| -------------------------------------- | ----------------------------- | --------------------------- |
| PostgreSQL 18 vs 16 inconsistent       | docker-compose.yml vs app.yml | Environment incompatibility |
| Incorrect volume `/var/lib/postgresql` | docker-compose.yml            | Data loss                   |
| No healthcheck in dev/test DBs         | docker-compose.yml            | Scripts may fail            |
| No healthcheck in app                  | docker-compose.app.yml        | Incorrect orchestration     |
| Hardcoded credentials                  | docker-compose.app.yml        | Security                    |
| No dumb-init                           | Dockerfile                    | Incorrect signal handling   |
| No restart policies                    | All                           | Containers don't recover    |
| No resource limits                     | All                           | Uncontrolled consumption    |

## Files Modified/Created

1. `Dockerfile` - Added dumb-init, healthcheck, curl
2. `docker-compose.yml` - Fixed volume, added healthchecks, unified PG version
3. `docker-compose.app.yml` - Environment variables, app healthcheck, restart policies
4. `src/app/api/health/route.ts` - **NEW** - Health endpoint
5. `.env.docker.example` - **NEW** - Docker variables template
6. `.dockerignore` - Optimized exclusions

---

## 1. Health Endpoint

**File:** `src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: 'healthy', timestamp: new Date().toISOString() },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: String(error) },
      { status: 503 },
    );
  }
}
```

---

## 2. Dockerfile Changes

- Install `dumb-init` and `curl` in base and runner
- Add `ENTRYPOINT ["dumb-init", "--"]` in migrate and runner
- Add `HEALTHCHECK` in runner stage

---

## 3. docker-compose.yml Changes

- Unified PostgreSQL version to 18-alpine
- Fixed volume: `/var/lib/postgresql/data`
- Added healthchecks with start_period
- Added restart policy (`unless-stopped`)
- Added resource limits (512M dev, 256M test)

---

## 4. docker-compose.app.yml Changes

- Environment variables (no hardcoded credentials)
- Required variables with `${VAR:?Required}` syntax
- App healthcheck via `/api/health`
- Restart policies
- Resource limits (1G)
- Explicit network

---

## 5. .env.docker.example

```bash
# Database (REQUIRED)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me-in-production
POSTGRES_DB=finance_tracker

# Auth (REQUIRED)
BETTER_AUTH_SECRET=generate-with-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 6. .dockerignore Updates

Added documentation exclusions to reduce image size:

```
*.md
!README.md
docs/
```

---

## Verification Commands

```bash
# Validate syntax
docker compose -f docker-compose.yml config
docker compose -f docker-compose.app.yml config

# Test dev databases
pnpm db:down
pnpm db:up
docker compose ps  # Verify healthy

# Test health endpoint (dev server)
pnpm dev &
curl http://localhost:3000/api/health

# Test full stack
cp .env.docker.example .env
# Edit .env with POSTGRES_PASSWORD and BETTER_AUTH_SECRET
docker compose -f docker-compose.app.yml up --build
curl http://localhost:3000/api/health

# Verify healthchecks
docker inspect finance_tracker_app --format='{{.State.Health.Status}}'
```

---

## Notes

- PostgreSQL unified to 18-alpine (more stable than 18, lighter image)
- dumb-init handles SIGTERM correctly for graceful shutdown
- Resource limits prevent excessive memory consumption
- Healthchecks enable correct orchestration and auto-healing
