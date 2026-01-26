# Plan de migracion de datos legacy

## Objetivo
Importar datos desde los CSV legacy ubicados en `docs/old db files/*` al esquema actual (accounts, categories, incomes, expenses, transfers) para un usuario especifico.

## Alcance y mapeos
1. Accounts
   - Legacy: `accounts.csv` (Name, Starting Balance)
   - Nuevo: `accounts` (name, initialBalance)
2. Categories (income/expense)
   - Legacy: `categories - incomes.csv` (Name)
   - Legacy: `categories - expenses.csv` (Name)
   - Nuevo: `categories` (name, type)
3. Incomes
   - Legacy: `incomes.csv` (Name, Source, Account, Amount, Date)
   - Nuevo: `incomes` (description, descriptionNormalized, categoryId, accountId, amount, date)
4. Expenses
   - Legacy: `expenses.csv` (Name, Category, Account, Amount, Date)
   - Nuevo: `expenses` (description, descriptionNormalized, categoryId, accountId, amount, date)
5. Transfers
   - Legacy: `transfers.csv` (Name, Transfer From, Transfer To, Amount, Date)
   - Nuevo: `transfers` (description, descriptionNormalized, fromAccountId, toAccountId, amount, date)

## Estrategia de migracion
1. Preparacion
   - Validar `DATABASE_URL` y que el usuario destino exista.
   - Elegir el directorio de datos (por defecto `docs/old db files/2026`).
2. Carga base
   - Crear cuentas desde `accounts.csv`.
   - Crear categorias income y expense desde sus CSVs.
3. Carga de transacciones
   - Importar incomes y expenses, resolviendo account/category por nombre.
   - Importar transfers, resolviendo cuentas origen/destino por nombre.
4. Validacion post-migracion
   - Verificar conteos (records insertados vs rows CSV).
   - Revisar montos totales por cuenta (si aplica).

## Supuestos y normalizaciones
- Se elimina el sufijo de URL en nombres tipo `Cuenta (https://...)`.
- Montos con `$` y comas se normalizan a decimal con 2 cifras.
- Fechas tipo `January 14, 2026` se parsean como fecha local y se guardan como `Date`.
- El script evita duplicados buscando un registro existente con los mismos campos clave.
- Las descripciones se normalizan (lowercase, sin acentos, espacios unificados) para busqueda eficiente en `descriptionNormalized`.

## Ejecutar la migracion
Configura primero las variables en `.env` (ver `.env.example`):
- `MIGRATION_USER_ID`
- `MIGRATION_DATA_DIR` (opcional, default `docs/old db files/2026`)
- `MIGRATION_DRY_RUN` (opcional, default `false`)

```bash
pnpm import:legacy
```

## Modo dry-run
```bash
pnpm import:legacy:dry
```

## Overrides por CLI
```bash
dotenv -e .env -- node scripts/import-legacy.mjs --user-id <USER_ID> --data-dir "docs/old db files/2026"
```

## Ejecucion registrada (2026-01-26)
Usuario: `0NYJtXVMFOhhTodnnKhwlLkKF3RHJrp7`  
Directorio: `docs/old db files/2026`

### Verificacion de conteos (CSV vs DB)
| Entidad | CSV | DB |
| --- | --- | --- |
| Accounts | 11 | 11 |
| Categories (income) | 12 | 12 |
| Categories (expense) | 54 | 54 |
| Incomes | 3 | 3 |
| Expenses | 48 | 48 |
| Transfers | 1 | 1 |

### Resumen por cuenta
| Cuenta | Incomes (count/sum) | Expenses (count/sum) | Transfers out (count/sum) | Transfers in (count/sum) |
| --- | --- | --- | --- | --- |
| Open Bank | 1 / 29219 | 7 / 27506.33 | 1 / 1000 | 0 / 0 |
| Efectivo | 0 / 0 | 9 / 2610 | 0 / 0 | 1 / 1000 |
| Si Vale | 1 / 3394 | 8 / 3685.11 | 0 / 0 | 0 / 0 |
| Broxel | 1 / 300 | 1 / 549 | 0 / 0 | 0 / 0 |
| Yo Te Presto | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| Banorte | 0 / 0 | 23 / 13319.68 | 0 / 0 | 0 / 0 |
| Banamex | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| Dólares (Cash) | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| DiDi | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| NU | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| Amazon | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

### Resumen por categoria (income)
| Categoria | Count | Amount |
| --- | --- | --- |
| Salario | 2 | 29519 |
| Vales | 1 | 3394 |

### Resumen por categoria (expense)
| Categoria | Count | Amount |
| --- | --- | --- |
| Vivienda | 2 | 2745.27 |
| Comida Rápida | 4 | 666.5 |
| Suscripciones | 1 | 600 |
| Electrónica | 1 | 749.99 |
| Despensa | 10 | 4189.02 |
| Salud | 3 | 328.5 |
| Crédito Santander | 1 | 19906.33 |
| Agua: CESPM | 1 | 1147 |
| Teléfono Movil | 1 | 503.78 |
| Alcohol | 2 | 1000 |
| Vehículos | 1 | 478 |
| Gasolina | 2 | 1712.89 |
| Car Wash | 1 | 265 |
| Suplementos | 1 | 769 |
| Barberia | 1 | 200 |
| Restaurante | 4 | 692 |
| Libros | 1 | 1941.3 |
| Cloud | 1 | 17 |
| Internet | 1 | 549 |
| Oficina/Papeleria | 1 | 629 |
| Crédito Infonavit | 4 | 5600 |
| Mascota | 2 | 1630.54 |
| Música & Guitarra | 1 | 950 |
| Asignación Familiar | 1 | 400 |

## Rollback (manual)
- Si la migracion falla, borrar registros importados por `user_id` (en orden inverso: transfers -> expenses/incomes -> categories -> accounts).
