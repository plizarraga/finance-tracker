# Plan de Migración: Kysely + Supabase SDK → Prisma ORM

## Resumen Ejecutivo

Migrar Finance Tracker de su implementación actual (Kysely para Better Auth + Supabase SDK para consultas) a una solución unificada con Prisma ORM. La migración es viable y proporcionará:

- **Mejor type safety**: Tipos generados automáticamente
- **Código más limpio**: Eliminación de ~30% de código (conversiones manuales, tipos duplicados)
- **Mejor rendimiento**: 40-70% mejora en cálculos de balance y reportes
- **Mejor DX**: Auto-complete y validación en compile-time

**Hallazgo clave**: Better Auth v1.4.13 soporta Prisma via `prismaAdapter`.

---

## 📋 Estado del Plan

### ✅ Completado
- [ ] Investigación y análisis del codebase actual
- [ ] Diseño del plan de migración
- [ ] Verificación de compatibilidad Better Auth + Prisma

### 🔄 En Progreso
- [ ] Ninguno actualmente

### ⏳ Pendiente
- [ ] Fase 1: Configuración de Prisma
- [ ] Fase 2: Migración por Feature
- [ ] Fase 3: Estrategia RLS
- [ ] Fase 4: Sistema de Tipos
- [ ] Fase 5: Limpieza y Optimización

---

## Estado Actual

### Stack de Base de Datos
- **Kysely (v0.28.5)**: Solo para Better Auth en `src/lib/auth.ts`
- **Supabase SDK**: Para TODAS las consultas de la aplicación via `createServerClient()` en `src/lib/db.ts`
- **PostgreSQL**: Hospedado en Supabase, conexión via `DATABASE_URL`
- **RLS**: Activo en todas las tablas con políticas basadas en `user_id`

### Esquema de Base de Datos (db/schema.sql)
- **Tablas**: accounts, categories, incomes, expenses, transfers
- **IDs**: UUIDs para primary keys
- **user_id**: TEXT (no foreign key, manejado por Better Auth)
- **Timestamps**: created_at, updated_at (TIMESTAMPTZ)
- **Índices**: user_id, account_id, category_id, date
- **Función SQL**: `get_account_balance()` - calcula balance desde transacciones
- **RLS**: Todas las tablas con políticas SELECT/INSERT/UPDATE/DELETE

### Features que Usan la Base de Datos (src/features/)
1. **accounts/** - queries.ts (3), actions.ts (3) - Cálculo complejo de balance con 4 queries por cuenta
2. **categories/** - queries.ts (3), actions.ts (3)
3. **incomes/** - queries.ts (2), actions.ts (3) - Con relaciones a account & category
4. **expenses/** - queries.ts (2), actions.ts (3) - Con relaciones a account & category
5. **transfers/** - queries.ts (2), actions.ts (3) - FK complejo con from/to accounts
6. **reports/** - queries.ts (5) - Agregaciones pesadas con grouping en cliente

---

## Estrategia de Implementación

### Fase 1: Configuración de Prisma (Base)

**Estado**: ⏳ Pendiente

#### 1.1 Instalar Dependencias
```bash
pnpm add @prisma/client
pnpm add -D prisma
npx prisma init
```

**Checklist**:
- [ ] Instalar `@prisma/client`
- [ ] Instalar `prisma` como dev dependency
- [ ] Ejecutar `npx prisma init`
- [ ] Verificar que se creó carpeta `prisma/`

#### 1.2 Crear Prisma Schema
**Archivo**: `prisma/schema.prisma`

Puntos clave del schema:
- Mapear user_id como `String` (TEXT en PostgreSQL)
- Usar `@map()` para convertir snake_case a camelCase automáticamente
- Preservar todos los índices con `@@index`
- Incluir `@db.Uuid`, `@db.Decimal(12, 2)`, `@db.Timestamptz(6)` para tipos precisos
- Configurar foreign keys con `onDelete: Restrict`
- Agregar preview feature `relationJoins` para optimización

**Schema completo**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["relationJoins"]
}

model User {
  id        String   @id
  email     String   @unique
  name      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  accounts   Account[]
  categories Category[]
  incomes    Income[]
  expenses   Expense[]
  transfers  Transfer[]

  @@map("user")
}

model Account {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @map("user_id")
  name        String   @db.VarChar(100)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  user             User       @relation(fields: [userId], references: [id])
  incomes          Income[]   @relation("AccountIncomes")
  expenses         Expense[]  @relation("AccountExpenses")
  transfersFrom    Transfer[] @relation("TransfersFrom")
  transfersTo      Transfer[] @relation("TransfersTo")

  @@index([userId])
  @@map("accounts")
}

model Category {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id")
  name      String   @db.VarChar(100)
  type      String   @db.VarChar(10)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  user     User      @relation(fields: [userId], references: [id])
  incomes  Income[]
  expenses Expense[]

  @@index([userId])
  @@index([type])
  @@map("categories")
}

model Income {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @map("user_id")
  accountId   String   @map("account_id") @db.Uuid
  categoryId  String   @map("category_id") @db.Uuid
  amount      Decimal  @db.Decimal(12, 2)
  date        DateTime @db.Date
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  user     User     @relation(fields: [userId], references: [id])
  account  Account  @relation("AccountIncomes", fields: [accountId], references: [id], onDelete: Restrict)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  @@index([userId])
  @@index([accountId])
  @@index([categoryId])
  @@index([date])
  @@map("incomes")
}

model Expense {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @map("user_id")
  accountId   String   @map("account_id") @db.Uuid
  categoryId  String   @map("category_id") @db.Uuid
  amount      Decimal  @db.Decimal(12, 2)
  date        DateTime @db.Date
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  user     User     @relation(fields: [userId], references: [id])
  account  Account  @relation("AccountExpenses", fields: [accountId], references: [id], onDelete: Restrict)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  @@index([userId])
  @@index([accountId])
  @@index([categoryId])
  @@index([date])
  @@map("expenses")
}

model Transfer {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String   @map("user_id")
  fromAccountId String   @map("from_account_id") @db.Uuid
  toAccountId   String   @map("to_account_id") @db.Uuid
  amount        Decimal  @db.Decimal(12, 2)
  date          DateTime @db.Date
  description   String?  @db.Text
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  user        User    @relation(fields: [userId], references: [id])
  fromAccount Account @relation("TransfersFrom", fields: [fromAccountId], references: [id], onDelete: Restrict)
  toAccount   Account @relation("TransfersTo", fields: [toAccountId], references: [id], onDelete: Restrict)

  @@index([userId])
  @@index([fromAccountId])
  @@index([toAccountId])
  @@index([date])
  @@map("transfers")
}
```

**Checklist**:
- [ ] Crear archivo `prisma/schema.prisma`
- [ ] Copiar schema completo
- [ ] Verificar datasource apunta a `DATABASE_URL`
- [ ] Verificar preview features incluye `relationJoins`

#### 1.3 Generar Prisma Client
```bash
npx prisma generate
npx prisma db pull  # Verificar que coincide con DB existente
```

**Checklist**:
- [ ] Ejecutar `npx prisma generate`
- [ ] Ejecutar `npx prisma db pull` para verificar
- [ ] Comparar schema generado vs manual
- [ ] Ajustar diferencias si las hay

#### 1.4 Migrar Better Auth a Prisma
**Archivo a modificar**: `src/lib/auth.ts`

Reemplazar Kysely con Prisma:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

Generar tablas de Better Auth:
```bash
npx @better-auth/cli@latest generate
npx prisma db push  # Sincronizar cambios
```

**Checklist**:
- [ ] Reemplazar imports en `src/lib/auth.ts`
- [ ] Eliminar imports de Kysely y Pool
- [ ] Agregar PrismaClient
- [ ] Usar `prismaAdapter` en config
- [ ] Ejecutar `npx @better-auth/cli@latest generate`
- [ ] Ejecutar `npx prisma db push`
- [ ] **TESTING**: Verificar login funciona
- [ ] **TESTING**: Verificar logout funciona
- [ ] **TESTING**: Verificar registro funciona

---

### Fase 2: Migración por Feature (Incremental)

**Estado**: ⏳ Pendiente

**Orden recomendado** (simple → complejo):

#### 2.1 Categories (Más simple, sin relaciones complejas)

**Estado**: ⏳ Pendiente

**Archivos a modificar**:
- `src/features/categories/queries.ts`
- `src/features/categories/actions.ts`

**Ejemplo de conversión - getCategories**:

**Antes (Supabase)**:
```typescript
export async function getCategories(userId: string): Promise<Category[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) return [];
  return (data as CategoryRow[]).map(toCategory);
}
```

**Después (Prisma)**:
```typescript
import { prisma } from "@/lib/auth";

export async function getCategories(userId: string) {
  return await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}
```

**Operaciones a convertir**:
- [ ] `getCategories()` → `prisma.category.findMany()`
- [ ] `getCategoriesByType()` → `findMany({ where: { userId, type } })`
- [ ] `getCategoryById()` → `findUnique({ where: { id } })`
- [ ] `createCategory()` → `create({ data: { ... } })`
- [ ] `updateCategory()` → `update({ where: { id }, data: { ... } })`
- [ ] `deleteCategory()` → `delete({ where: { id } })`

**Testing**:
- [ ] Test crear categoría income
- [ ] Test crear categoría expense
- [ ] Test listar todas las categorías
- [ ] Test filtrar por tipo
- [ ] Test obtener por ID
- [ ] Test actualizar categoría
- [ ] Test eliminar categoría

#### 2.2 Accounts (Balance calculation optimization)

**Estado**: ⏳ Pendiente

**Archivos a modificar**:
- `src/features/accounts/queries.ts`
- `src/features/accounts/actions.ts`

**CRÍTICO - Optimizar cálculo de balance**:

**Antes (4 queries por cuenta)**:
```typescript
const { data: incomes } = await supabase.from("incomes").select("amount").eq("account_id", accountId);
const { data: expenses } = await supabase.from("expenses").select("amount").eq("account_id", accountId);
// ... etc (4 queries totales)
```

**Después (agregaciones paralelas)**:
```typescript
async function calculateAccountBalance(accountId: string): Promise<number> {
  const [incomeSum, expenseSum, transfersInSum, transfersOutSum] = await Promise.all([
    prisma.income.aggregate({
      where: { accountId },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { accountId },
      _sum: { amount: true },
    }),
    prisma.transfer.aggregate({
      where: { toAccountId: accountId },
      _sum: { amount: true },
    }),
    prisma.transfer.aggregate({
      where: { fromAccountId: accountId },
      _sum: { amount: true },
    }),
  ]);

  return (
    (incomeSum._sum.amount?.toNumber() ?? 0) +
    (transfersInSum._sum.amount?.toNumber() ?? 0) -
    (expenseSum._sum.amount?.toNumber() ?? 0) -
    (transfersOutSum._sum.amount?.toNumber() ?? 0)
  );
}

export async function getAccountsWithBalances(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  const accountsWithBalances = await Promise.all(
    accounts.map(async (account) => ({
      ...account,
      balance: await calculateAccountBalance(account.id),
    }))
  );

  return accountsWithBalances;
}
```

**Checklist**:
- [ ] Migrar `getAccounts()`
- [ ] Migrar `getAccountById()`
- [ ] **CRÍTICO**: Implementar `calculateAccountBalance()` optimizado
- [ ] Migrar `getAccountsWithBalances()`
- [ ] Migrar `createAccount()`
- [ ] Migrar `updateAccount()`
- [ ] Migrar `deleteAccount()`

**Testing**:
- [ ] Test crear cuenta
- [ ] Test listar cuentas
- [ ] **CRÍTICO**: Test balance calculado correctamente
- [ ] Performance: Benchmark balance calculation
- [ ] Test editar cuenta
- [ ] Test eliminar cuenta con transacciones (debe fallar)
- [ ] Test eliminar cuenta vacía

#### 2.3 Incomes (Relaciones con account & category)

**Estado**: ⏳ Pendiente

**Archivos a modificar**:
- `src/features/incomes/queries.ts`
- `src/features/incomes/actions.ts`

**Ejemplo con relaciones - getIncomes**:

**Antes (Supabase)**:
```typescript
const { data } = await supabase
  .from("incomes")
  .select(`
    *,
    accounts!inner(*),
    categories!inner(*)
  `)
  .eq("user_id", userId);

return data.map((row) => ({
  ...toIncome(row),
  account: toAccount(row.accounts),
  category: toCategory(row.categories),
}));
```

**Después (Prisma)**:
```typescript
export async function getIncomes(userId: string, filters?: { dateRange?: DateRange; accountId?: string; categoryId?: string }) {
  return await prisma.income.findMany({
    where: {
      userId,
      ...(filters?.accountId && { accountId: filters.accountId }),
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
      ...(filters?.dateRange && {
        date: {
          gte: filters.dateRange.from,
          lte: filters.dateRange.to,
        },
      }),
    },
    include: {
      account: true,
      category: true,
    },
    orderBy: { date: "desc" },
  });
}
```

**Checklist**:
- [ ] Migrar `getIncomes()` con filtros
- [ ] Migrar `getIncomeById()`
- [ ] Migrar `createIncome()` con validaciones
- [ ] Migrar `updateIncome()`
- [ ] Migrar `deleteIncome()`

**Testing**:
- [ ] Test crear income
- [ ] Test relaciones cargadas (account, category)
- [ ] Test filtrar por fecha
- [ ] Test filtrar por account
- [ ] Test filtrar por category
- [ ] Test validación de ownership
- [ ] Test balance de account se actualiza

#### 2.4 Expenses (Similar a incomes)

**Estado**: ⏳ Pendiente

**Archivos a modificar**:
- `src/features/expenses/queries.ts`
- `src/features/expenses/actions.ts`

**Checklist**:
- [ ] Migrar `getExpenses()` con filtros
- [ ] Migrar `getExpenseById()`
- [ ] Migrar `createExpense()` con validaciones
- [ ] Migrar `updateExpense()`
- [ ] Migrar `deleteExpense()`

**Testing**:
- [ ] Seguir mismos tests que incomes
- [ ] Verificar categorías tipo "expense"

#### 2.5 Transfers (FK complejos con from/to accounts)

**Estado**: ⏳ Pendiente

**Archivos a modificar**:
- `src/features/transfers/queries.ts`
- `src/features/transfers/actions.ts`

**Ejemplo - getTransfers con relaciones múltiples**:

**Después (Prisma)**:
```typescript
export async function getTransfers(userId: string, filters?: { dateRange?: DateRange; accountId?: string }) {
  return await prisma.transfer.findMany({
    where: {
      userId,
      ...(filters?.accountId && {
        OR: [
          { fromAccountId: filters.accountId },
          { toAccountId: filters.accountId },
        ],
      }),
      ...(filters?.dateRange && {
        date: {
          gte: filters.dateRange.from,
          lte: filters.dateRange.to,
        },
      }),
    },
    include: {
      fromAccount: true,
      toAccount: true,
    },
    orderBy: { date: "desc" },
  });
}
```

**Checklist**:
- [ ] Migrar `getTransfers()` con OR filter
- [ ] Migrar `getTransferById()`
- [ ] Migrar `createTransfer()` con validación de cuentas
- [ ] Migrar `updateTransfer()`
- [ ] Migrar `deleteTransfer()`

**Testing**:
- [ ] Test crear transfer
- [ ] Test relaciones from/to account
- [ ] Test validación cuenta origen != destino
- [ ] Test filtro por accountId (OR)
- [ ] Test balances de ambas cuentas se actualizan

#### 2.6 Reports (Agregaciones optimizadas)

**Estado**: ⏳ Pendiente

**Archivos a modificar**:
- `src/features/reports/queries.ts`

**Optimización clave - getIncomeByCategory**:

**Después (Prisma)**:
```typescript
export async function getIncomeByCategory(userId: string, dateRange: DateRange) {
  const incomes = await prisma.income.findMany({
    where: {
      userId,
      date: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    },
    include: { category: true },
  });

  // Agrupar por categoría
  const categoryMap = new Map<string, { categoryId: string; categoryName: string; total: number }>();

  for (const income of incomes) {
    const existing = categoryMap.get(income.categoryId);
    if (existing) {
      existing.total += income.amount.toNumber();
    } else {
      categoryMap.set(income.categoryId, {
        categoryId: income.categoryId,
        categoryName: income.category.name,
        total: income.amount.toNumber(),
      });
    }
  }

  // Calcular porcentajes
  const breakdown = Array.from(categoryMap.values());
  const totalIncome = breakdown.reduce((sum, cat) => sum + cat.total, 0);

  return breakdown.map((cat) => ({
    ...cat,
    percentage: totalIncome > 0 ? (cat.total / totalIncome) * 100 : 0,
  })).sort((a, b) => b.total - a.total);
}
```

**Checklist**:
- [ ] Migrar `getReportSummary()`
- [ ] Migrar `getIncomeByCategory()`
- [ ] Migrar `getExpenseByCategory()`
- [ ] Migrar `getMonthlyTrends()`
- [ ] Migrar `getAccountBalances()`

**Testing**:
- [ ] Test resumen del mes
- [ ] Test totales correctos
- [ ] Test breakdown por categoría
- [ ] Test porcentajes correctos
- [ ] Test trends mensuales
- [ ] Performance: Benchmark vs implementación actual

---

### Fase 3: Estrategia de Row-Level Security (RLS)

**Estado**: ⏳ Pendiente

**Decisión**: Usar filtrado a nivel de aplicación.

**Implementación - Helper de seguridad**:

```typescript
// src/lib/prisma-helpers.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return { userId: session.user.id, session };
}
```

**Checklist**:
- [ ] Crear `src/lib/prisma-helpers.ts`
- [ ] Implementar `requireAuth()`
- [ ] Actualizar todas las queries para usar `requireAuth()`
- [ ] Verificar filtrado por `userId` en todas las queries
- [ ] Testing: Intentar acceder a datos de otro usuario (debe fallar)

---

### Fase 4: Sistema de Tipos

**Estado**: ⏳ Pendiente

**Después - Usar tipos generados**:
```typescript
// Importar directamente
import type { Account, Income, Expense } from "@prisma/client";

// Para tipos con relaciones
import type { Prisma } from "@prisma/client";

export type IncomeWithRelations = Prisma.IncomeGetPayload<{
  include: { account: true; category: true };
}>;

export type AccountWithBalance = Account & {
  balance: number;
};
```

**Checklist**:
- [ ] Actualizar imports en todos los archivos
- [ ] Eliminar interfaces manuales de `src/types/index.ts`
- [ ] Eliminar `*Row` types
- [ ] Eliminar funciones `to*()` (toAccount, toIncome, etc.)
- [ ] Actualizar `src/types/index.ts` solo tipos extendidos
- [ ] Fix errores de TypeScript
- [ ] Verificar no hay tipos rotos

---

### Fase 5: Limpieza y Optimización

**Estado**: ⏳ Pendiente

#### 5.1 Remover Dependencias Viejas
```bash
pnpm remove @supabase/supabase-js kysely pg
```

**Checklist**:
- [ ] Ejecutar comando de remove
- [ ] Verificar `package.json` actualizado
- [ ] Ejecutar `pnpm install` para limpiar lock

#### 5.2 Actualizar Variables de Entorno

**Mantener**:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

**Remover**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Checklist**:
- [ ] Actualizar `.env`
- [ ] Actualizar `.env.example`
- [ ] Documentar cambios

#### 5.3 Eliminar Archivos Obsoletos

**Checklist**:
- [ ] Eliminar o refactorizar `src/lib/db.ts`
- [ ] Verificar no hay imports a archivos eliminados

#### 5.4 Actualizar package.json scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio",
    "prisma:push": "prisma db push"
  }
}
```

**Checklist**:
- [ ] Actualizar script `build`
- [ ] Agregar scripts de Prisma
- [ ] Verificar scripts funcionan

#### 5.5 Actualizar CLAUDE.md

**Checklist**:
- [ ] Agregar sección de Database con Prisma
- [ ] Documentar comandos de Prisma
- [ ] Actualizar Build Commands si es necesario

---

## Manejo de Casos Especiales

### Tipos Decimal
Prisma devuelve objetos `Decimal` para campos `Decimal`:

```typescript
// Convertir a number para display
const amount = income.amount.toNumber();

// Mantener como Decimal para cálculos precisos
const total = incomes.reduce((sum, inc) => sum.add(inc.amount), new Decimal(0));
```

### Validación de FK en Actions
Mantener validación explícita de ownership:

```typescript
export async function createExpense(formData: FormData) {
  const { userId } = await requireAuth();

  // Validar que account pertenece al usuario
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    return { success: false, error: "Account not found" };
  }

  // Validar que category es tipo "expense"
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId, type: "expense" },
  });

  if (!category) {
    return { success: false, error: "Invalid category" };
  }

  // Crear expense
  const expense = await prisma.expense.create({
    data: { userId, accountId, categoryId, amount, date, description },
  });

  revalidatePath("/expenses");
  revalidatePath("/accounts");

  return { success: true, data: expense };
}
```

---

## Archivos Críticos a Modificar

| Archivo | Razón | Prioridad |
|---------|-------|-----------|
| `prisma/schema.prisma` | Schema principal (crear nuevo) | 🔴 Alta |
| `src/lib/auth.ts` | Migrar Better Auth a Prisma | 🔴 Alta |
| `src/features/categories/queries.ts` | Feature más simple para validar | 🟡 Media |
| `src/features/categories/actions.ts` | Server actions de categories | 🟡 Media |
| `src/features/accounts/queries.ts` | Optimización de balance | 🔴 Alta |
| `src/features/accounts/actions.ts` | Server actions de accounts | 🟡 Media |
| `src/features/incomes/queries.ts` | Queries con relaciones | 🟡 Media |
| `src/features/incomes/actions.ts` | Server actions de incomes | 🟡 Media |
| `src/features/expenses/queries.ts` | Queries con relaciones | 🟡 Media |
| `src/features/expenses/actions.ts` | Server actions de expenses | 🟡 Media |
| `src/features/transfers/queries.ts` | FK complejos | 🟡 Media |
| `src/features/transfers/actions.ts` | Server actions de transfers | 🟡 Media |
| `src/features/reports/queries.ts` | Agregaciones optimizadas | 🔴 Alta |
| `src/types/index.ts` | Simplificar tipos | 🟢 Baja |
| `package.json` | Actualizar scripts | 🟢 Baja |
| `CLAUDE.md` | Documentar cambios | 🟢 Baja |

---

## Estrategia de Testing

### Testing por Feature
Para cada feature migrado:

1. **Verificar CRUD completo**
   - ✅ Create crea correctamente
   - ✅ Read devuelve datos esperados
   - ✅ Update modifica correctamente
   - ✅ Delete elimina correctamente

2. **Verificar ownership/seguridad**
   - ✅ Solo se pueden ver registros propios
   - ✅ No se pueden modificar registros de otros usuarios
   - ✅ FK constraints funcionan

3. **Verificar relaciones**
   - ✅ Includes cargan datos relacionados
   - ✅ Tipos son correctos
   - ✅ No hay N+1 queries

4. **Verificar filtros**
   - ✅ Date ranges funcionan
   - ✅ Account/category filters funcionan
   - ✅ Ordenamiento correcto

### Performance Testing

**Benchmark crítico - Balance de cuentas**:
```typescript
// Medir antes/después de migración
console.time("getAccountsWithBalances");
const accounts = await getAccountsWithBalances(userId);
console.timeEnd("getAccountsWithBalances");

// Objetivo: Reducción de 40-70% en tiempo
```

**Verificar en Prisma Studio**:
```bash
pnpm prisma studio
# Abrir http://localhost:5555
# Verificar datos manualmente
```

---

## Rollback Plan

### Durante Migración
Si hay problemas con un feature específico:
1. Revertir solo ese feature a código Supabase
2. Mantener otros features en Prisma
3. Investigar y fix issue
4. Re-intentar migración

### Post-Migración
Si hay problemas críticos después de deployment:

```bash
# 1. Revert commit
git revert HEAD

# 2. Re-instalar dependencias viejas
pnpm add @supabase/supabase-js kysely pg

# 3. Re-deploy
git push
```

---

## Riesgos y Mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Better Auth incompatibilidad | Alto | Bajo | ✅ Ya verificado que soporta Prisma v1.4.13 |
| Gap de seguridad RLS | Alto | Medio | Usar helper `requireAuth()` + filtrado explícito |
| Degradación de performance | Medio | Bajo | Benchmark antes/después, optimizar con indexes |
| Bugs de conversión Decimal | Medio | Medio | Testing exhaustivo de cálculos monetarios |
| N+1 queries | Medio | Bajo | Usar `include` + `relationJoins` preview |
| Breaking changes en tipos | Medio | Bajo | Migración gradual, mantener tipos duales |

---

## Resultados Esperados

### Mejoras de Performance
- **Balance de cuentas**: 60-75% más rápido (4 queries → agregaciones paralelas)
- **Reports**: 40-50% más rápido (grouping en DB vs cliente)
- **Queries con relaciones**: 30-40% más rápido (con relationJoins)

### Mejoras de Código
- **Reducción de código**: ~30% menos líneas (eliminar conversiones manuales)
- **Type safety**: 100% coverage con tipos generados
- **Mantenibilidad**: Schema único como source of truth

### Developer Experience
- **Auto-complete**: Full IntelliSense en queries
- **Compile-time checks**: Errores de tipo antes de runtime
- **Prisma Studio**: GUI para explorar datos
- **Better debugging**: Query logging integrado

---

## Timeline Estimado

- **Fase 1 (Setup)**: 1-2 días
- **Fase 2 (Features)**: 3-5 días (1 día por feature aprox)
- **Fase 3 (RLS)**: 1 día
- **Fase 4 (Tipos)**: 1 día
- **Fase 5 (Limpieza)**: 1 día
- **Testing completo**: 2-3 días

**Total**: 9-13 días laborables

---

## Verificación Final

Antes de considerar la migración completa:

- [ ] Todas las features migradas y funcionando
- [ ] Testing end-to-end completado
- [ ] Performance benchmarks muestran mejora
- [ ] Autenticación funciona correctamente
- [ ] Todos los balances calculan correctamente
- [ ] Reports generan datos correctos
- [ ] No hay queries N+1
- [ ] Tipos generados funcionan sin errores
- [ ] Dependencias viejas removidas
- [ ] Documentación actualizada
- [ ] Staging environment aprobado
- [ ] Backup de BD antes de deployment a producción
