# Architecture

Este documento describe la arquitectura de alto nivel del sistema, el flujo de datos y las relaciones entre componentes.

---

## 1. System Overview

### Tipo de Aplicación

Finance Tracker es un **monolito Next.js** que utiliza App Router. Un único codebase sirve tanto la interfaz de usuario como la lógica de backend.

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente                              │
│                  (Browser / Mobile)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js App Router                        │
│  ┌───────────────┐  ┌───────────────┐                       │
│  │   UI Pages    │  │Route Handlers │                       │
│  │  (React/SSR)  │  │  (API Routes) │                       │
│  └───────────────┘  └───────────────┘                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Better Auth (JS)                          │
│              (Autenticación de usuarios)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Prisma ORM                              │
│              (Acceso a base de datos)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│             PostgreSQL (local/Railway)                       │
│                  (Base de datos)                             │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js (React), shadcn/ui |
| Backend | Next.js Route Handlers (App Router API routes) |
| Base de Datos | PostgreSQL + Prisma (local Docker for dev/test, Railway in prod) |
| Autenticación | Better Auth (JS) |
| Hosting | Railway |

### Estructura del Proyecto

```
app/              → Rutas y pantallas (App Router)
features/         → Lógica de dominio por feature
  ├── accounts/   → Gestión de cuentas
  ├── categories/ → Categorías de ingreso/gasto
  ├── incomes/    → Registro de ingresos
  ├── expenses/   → Registro de gastos
  ├── transfers/  → Transferencias entre cuentas
  ├── reports/    → Reportes y gráficos
  ├── expense-templates/  → Plantillas de gastos
  ├── income-templates/   → Plantillas de ingresos
  └── transfer-templates/ → Plantillas de transferencias
lib/              → Utilidades compartidas
prisma/           → Schema y cliente Prisma
src/test/         → Unit tests, data factories, helpers
e2e/              → Playwright end-to-end tests
```

Cada feature es dueño de:
- Schemas/validación
- Queries (lecturas)
- Helpers cliente para APIs

Relación entre capas:
- `features/*/api.ts` actúa como cliente de `app/api/**/route.ts`
- `app/api` contiene validación, auth y mutaciones
- La UI consume solo el cliente, facilitando una migración futura de backend

### Modelos de Dominio

```
┌──────────┐
│   User   │
└────┬─────┘
     │ 1:N
     ▼
┌──────────┐       ┌────────────┐
│ Account  │◄──────│  Category  │
└────┬─────┘       └─────┬──────┘
     │                   │
     │ 1:N               │ 1:N
     ▼                   ▼
┌──────────┐       ┌──────────┐       ┌──────────┐
│  Income  │       │ Expense  │       │ Transfer │
└──────────┘       └──────────┘       └──────────┘
```

**Decisión de diseño:** Modelos separados para Income, Expense y Transfer en lugar de una abstracción genérica "Transaction". Esto proporciona semántica clara sobre abstracciones inteligentes.

**Plantillas:** Modelos de plantilla para crear movimientos de forma rápida (ExpenseTemplate, IncomeTemplate, TransferTemplate) vinculados a cuentas y categorías opcionales.

### Estrategia de Balances

Los balances son **calculados, no almacenados**:

```
Balance de Cuenta = Σ Ingresos - Σ Gastos ± Transferencias
```

Beneficios:
- Única fuente de verdad
- Sin riesgo de desincronización
- Más fácil de razonar

---

## 2. Data Flow

### Flujo Principal de Operaciones

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE DATOS                              │
└─────────────────────────────────────────────────────────────────────┘

1. AUTENTICACIÓN
   ┌────────┐      ┌─────────────┐      ┌──────────┐
   │ Usuario│─────►│ Better Auth │─────►│ Sesión   │
   └────────┘      └─────────────┘      └──────────┘

2. CONFIGURACIÓN INICIAL
   ┌────────┐      ┌─────────────┐      ┌──────────┐
   │ Usuario│─────►│  Crear      │─────►│ PostgreSQL│
   └────────┘      │  Cuentas &  │      │   (DB)   │
                   │  Categorías │      └──────────┘
                   └─────────────┘

3. GESTIÓN DE PLANTILLAS
   ┌────────┐      ┌─────────────┐      ┌──────────┐
   │ Usuario│─────►│ Server      │─────►│ PostgreSQL│
   └────────┘      │ Action      │      │   (DB)   │
                   │ (Templates) │      └──────────┘
                   └─────────────┘

4. REGISTRO DE MOVIMIENTOS
   ┌────────┐      ┌─────────────┐      ┌──────────┐
   │ Usuario│─────►│ Server      │─────►│ PostgreSQL│
   └────────┘      │ Action      │      │   (DB)   │
                   │ (Income/    │      └──────────┘
                   │  Expense/   │
                   │  Transfer)  │
                   └─────────────┘

5. CONSULTA DE REPORTES
   ┌────────┐      ┌─────────────┐      ┌──────────┐      ┌──────────┐
   │ Usuario│─────►│ Query Prisma│─────►│ Cálculo  │─────►│ Render   │
   └────────┘      │ (filtros)   │      │ Balances │      │ Charts   │
                   └─────────────┘      └──────────┘      └──────────┘
```

### Flujo Detallado por Operación

#### Registro de Ingreso/Gasto

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   Form   │────►│ Validate │────►│  Server  │────►│ PostgreSQL│
│   (UI)   │     │  (Zod?)  │     │  Action  │     │  INSERT  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
                                 ┌──────────┐
                                 │Revalidate│
                                 │   Path   │
                                 └──────────┘
```

#### Uso de Plantillas

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Template │────►│  Server  │────►│ PostgreSQL│────►│  Prefill │
│  Button  │     │  Action  │     │  Query   │     │  Form    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

#### Consulta de Balance de Cuenta

```
┌──────────┐     ┌──────────────────────────────────────┐     ┌──────────┐
│  Request │────►│              QUERY                    │────►│   UI     │
│  (Page)  │     │  SELECT                               │     │  Render  │
└──────────┘     │    SUM(incomes) - SUM(expenses)       │     └──────────┘
                 │    + SUM(transfers_in)                │
                 │    - SUM(transfers_out)               │
                 │  WHERE account_id = ?                 │
                 └──────────────────────────────────────┘
```

#### Generación de Reportes

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Filtros  │────►│  Query   │────►│ Agregar  │────►│  Charts  │
│ (fecha,  │     │   DB     │     │  Datos   │     │  (React) │
│ categoría│     │          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### Principios de Diseño del Flujo de Datos

1. **Sin API pública** - Acceso interno vía Route Handlers
2. **Queries directas** - Reportes generados desde queries SQL, sin tablas pre-agregadas
3. **Funciones explícitas** - Sin efectos secundarios ocultos
4. **Compute on read** - Balances calculados al momento de lectura

### Seguridad en el Flujo

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Request  │────►│  Auth    │────►│  User    │────►│  Data    │
│          │     │  Check   │     │  Scope   │     │  Access  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
               ┌──────────┐
               │ Deny if  │
               │ no auth  │
               └──────────┘
```

- Todas las operaciones requieren autenticación
- Los datos están scoped por usuario
- `requireAuth` centraliza verificación y scope de usuario en queries/actions
- HTTPS en producción
- Secrets en variables de entorno
