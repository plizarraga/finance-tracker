# Architecture

Este documento describe la arquitectura de alto nivel del sistema, el flujo de datos y las relaciones entre componentes.

---

## 1. System Overview

### Tipo de Aplicación

Finance Tracker SLC es un **monolito Next.js** que utiliza App Router. Un único codebase sirve tanto la interfaz de usuario como la lógica de backend.

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente                              │
│                  (Browser / Mobile)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js App Router                        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │   UI Pages    │  │Server Actions │  │Route Handlers │   │
│  │  (React/SSR)  │  │  (Mutations)  │  │  (API Routes) │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
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
│                 Supabase (PostgreSQL)                       │
│                  (Base de datos)                            │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js (React), shadcn/ui |
| Backend | Next.js Server Actions / Route Handlers |
| Base de Datos | Supabase (PostgreSQL) |
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
  └── reports/    → Reportes y gráficos
lib/              → Utilidades compartidas
db/               → Acceso a base de datos y queries
```

Cada feature es dueño de:
- Server actions (mutaciones)
- Queries (lecturas)
- Validación

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
   │ Usuario│─────►│  Crear      │─────►│ Supabase │
   └────────┘      │  Cuentas &  │      │   (DB)   │
                   │  Categorías │      └──────────┘
                   └─────────────┘

3. REGISTRO DE MOVIMIENTOS
   ┌────────┐      ┌─────────────┐      ┌──────────┐
   │ Usuario│─────►│ Server      │─────►│ Supabase │
   └────────┘      │ Action      │      │   (DB)   │
                   │ (Income/    │      └──────────┘
                   │  Expense/   │
                   │  Transfer)  │
                   └─────────────┘

4. CONSULTA DE REPORTES
   ┌────────┐      ┌─────────────┐      ┌──────────┐      ┌──────────┐
   │ Usuario│─────►│ Query DB    │─────►│ Cálculo  │─────►│ Render   │
   └────────┘      │ (filtros)   │      │ Balances │      │ Charts   │
                   └─────────────┘      └──────────┘      └──────────┘
```

### Flujo Detallado por Operación

#### Registro de Ingreso/Gasto

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   Form   │────►│ Validate │────►│  Server  │────►│ Supabase │
│   (UI)   │     │  (Zod?)  │     │  Action  │     │  INSERT  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
                                 ┌──────────┐
                                 │Revalidate│
                                 │   Path   │
                                 └──────────┘
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

1. **Sin API pública** - Acceso interno vía Server Actions y Route Handlers
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
- HTTPS en producción
- Secrets en variables de entorno
