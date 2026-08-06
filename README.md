# Admino

Monolito local con frontend web en Vite y backend Express.

## Requisitos

- Node.js 20+
- npm
- Postgres local si vas a usar el API en modo live

## Setup

```bash
npm run setup
npm run prisma:generate
```

## Desarrollo

```bash
npm run dev
```

Levanta ambos procesos:

- Web: `http://localhost:5173`
- API: `http://localhost:3000`

Comandos separados:

```bash
npm run dev:web
npm run dev:api
```

## Build y checks

```bash
npm run type-check
npm run type-check:api
npm run build
```

## Estructura monolitica

```text
admino/
├── apps/
│   ├── api/    # Backend Express + Prisma
│   └── web/    # Frontend React + Vite
├── docs/       # Solo docs vivos de producto/limpieza
└── package.json
```

El repo ya no usa Expo ni carpetas legacy en la raiz. Las rutas, componentes y servicios viven bajo `apps/web` y `apps/api`.

## Documentos vivos

- `docs/athlete-planning-roadmap.md`: roadmap principal de planes y seguimiento de atletas.
- `docs/frontend-cleanup.md`: bitacora vigente de limpieza frontend.
- `docs/styles-cleanup.md`: estado actual de estilos y deuda visual.

Los documentos de flujo/referencia viejos se consolidaron aqui. Los resúmenes de sesión y planes duplicados se borraron.

## Flujo de producto

Admino maneja cuentas multi-tenant. En UI conviene hablar de **Cuentas**; en codigo todavia existen nombres internos como `Client`, `organization` y tablas mapeadas a nombres historicos.

Roles principales:

| Rol | Uso | Alcance |
|---|---|---|
| `SYSTEM_ADMIN` | Admin del sistema | Ve y administra todas las cuentas. |
| `OWNER` | Propietario de cuenta | Administra su cuenta, staff, atletas, finanzas y planes habilitados. |
| `ADMIN` | Staff de cuenta | Opera modulos habilitados de su cuenta. |
| `MEMBER` | Atleta/usuario final | Ve su entrenamiento y datos propios. |

Flujo de academia:

1. El admin del sistema crea una cuenta.
2. El sifu entra como `OWNER` o `ADMIN`.
3. El sifu crea planes de entrenamiento en calendario.
4. El sifu asigna planes a atletas activos.
5. Cada atleta entra a `Mi entrenamiento`, marca ejercicios, guarda RPE y notas.
6. El sifu revisa avance para ajustar la planeacion.

## Frontend

Ruta: `apps/web`.

Stack:

- React + TypeScript
- Vite
- React Router
- Zustand
- TanStack Query
- CSS global en `apps/web/src/web/styles.css` + utilidades Tailwind

Estructura principal:

```text
apps/web/src/
├── features/       # Pantallas por dominio
├── shared/         # UI, hooks, stores, API client y tipos comunes
└── web/            # App, rutas, layout, nav y estilos globales
```

Rutas y navegacion:

- `apps/web/src/web/routes.ts`: rutas canonicas.
- `apps/web/src/web/navItems.tsx`: menu por rol.
- `apps/web/src/web/App.tsx`: guards de sesion, rol y rutas.
- `apps/web/src/web/layouts/Sidebar.tsx`: shell autenticado.

Features relevantes:

- `features/admin`: administracion de cuentas por `SYSTEM_ADMIN`.
- `features/expenses`: finanzas.
- `features/assistant`: notas/IA.
- `features/members`: pantalla fusionada de staff y atletas.
- `features/client-settings`: configuracion de cuenta y atletas.
- `features/athlete-dashboard`: calendario de planes y lista de atletas para staff.
- `features/athlete-tracker`: vista del atleta para entrenamiento del dia.

Modo mock:

- `apps/web/src/shared/config/env.ts` controla `VITE_API_MODE` y `VITE_USE_MOCK`.
- En mock, la app usa datos de `apps/web/src/shared/api/mocks`.
- En live, usa `VITE_API_URL`.

## Backend

Ruta: `apps/api`.

Stack:

- Express + TypeScript
- Prisma
- PostgreSQL
- JWT
- Nodemailer para reset de password
- Google Gemini para endpoints de IA, si `GEMINI_API_KEY` existe

Estructura principal:

```text
apps/api/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
└── src/
    ├── app.ts
    ├── index.ts
    ├── config/
    ├── lib/
    ├── middleware/
    ├── routes/
    └── types/
```

Middleware:

- `requireAuth`: valida JWT y llena `req.user`.
- `requireRole(...)`: limita endpoints por rol.
- `requireFeature(feature)`: valida feature flags de cuenta; `SYSTEM_ADMIN` tiene bypass.
- `loadOrgContext`: carga contexto de cuenta cuando aplica.

Rutas principales:

- `auth`: login, refresh, cambio y reset de contraseña.
- `admin`: cuentas, usuarios owner e impersonacion.
- `clients`: configuracion, branding y staff.
- `members`: atletas y `/members/me`.
- `expenses`: datos de finanzas.
- `training-plans`: CRUD de planes, asignaciones y `/my-plan`.
- `training-events`: eventos del calendario.
- `workout-checks`: checks por ejercicio/dia.
- `workout-feedback`: RPE y notas por atleta/dia.
- `ai`: analisis de notas con Gemini.
- `audit-logs`, `plans`, `member-roles`, `notifications`.

Notas de Prisma:

- `Client` representa una cuenta/tenant, aunque la tabla fisica se llama `organizations`.
- `Member` representa atleta/usuario final, aunque hay nombres historicos en tablas.
- `TrainingPlan.cells` guarda un mapa `{ "YYYY-MM-DD": "texto del dia" }`.

## Estado

Ya hecho:

- Monolito `apps/web` + `apps/api`.
- Login para `SYSTEM_ADMIN`, staff de cuenta y atletas.
- CRUD de cuentas, staff y atletas.
- Finanzas basicas por cuenta.
- Planes de entrenamiento por cuenta.
- Asignacion de planes a atletas.
- Vista `Mi entrenamiento` con checklist, timer, RPE y notas.
- Password reset con SMTP.
- Endpoints IA con Gemini y pantalla de notas/asistente.
- Guards de rol en frontend y backend.
- Feature flags backend para finanzas y planes.
- Limpieza grande de textos, sidebar, estilos compartidos y docs.

Falta importante:

- Revisar mobile real del calendario del sifu.
- Mostrar al sifu checks, RPE y notas por dia en `Actividad`.
- Validar explicitamente que `memberId` pertenezca a la cuenta antes de asignar/desasignar planes.
- Definir una sola asignacion activa por atleta.
- Cambiar UI visible de `Organizaciones` a `Cuentas`.
- Probar flujos live contra Postgres real.
- Resolver vulnerabilidades pendientes de `react-router` cuando haya fix limpio.

## Variables

Frontend (`apps/web/.env.local`):

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_MODE=MOCK
VITE_USE_MOCK=true
```

Backend (`apps/api/.env`):

```env
PORT=3000
DATABASE_URL=postgresql://admino:admino@localhost:5432/admino_dev
JWT_SECRET=dev-secret-change-in-production
CORS_ORIGIN=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

`CORS_ALLOWED_ORIGINS` acepta una lista separada por comas y aplica tambien para sockets. Si no existe, el API usa `CORS_ORIGIN` como fallback. `FRONTEND_URL` se usa para links como reset de contraseña.

## Base de datos

Desde `apps/api`:

```bash
docker compose up -d
npm run prisma:migrate
npm run prisma:generate
```

En deploy, usar migraciones:

```bash
npx prisma migrate deploy
```

## Cuentas mock

| Rol | Email | Password |
|---|---|---|
| System Admin | `admin@admino.app` | `password` |
| Owner | `coach@admino.app` | `password` |
| Admin | `manager@admino.app` | `password` |
| Member | `athlete@admino.app` | `password` |
