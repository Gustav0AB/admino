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

## Estructura

```text
admino/
├── apps/
│   ├── api/    # Backend Express + Prisma
│   └── web/    # Frontend React + Vite
└── package.json
```

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
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Cuentas mock

| Rol | Email | Password |
|---|---|---|
| System Admin | `admin@admino.app` | `password` |
| Owner | `coach@admino.app` | `password` |
| Admin | `manager@admino.app` | `password` |
| Member | `athlete@admino.app` | `password` |
