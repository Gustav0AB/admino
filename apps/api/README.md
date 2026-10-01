# Admino API

Backend Express + TypeScript + Prisma para Admino.

## Desarrollo

Desde la raíz del monolito:

```bash
npm run dev:api
```

O desde esta carpeta:

```bash
npm run start:dev
```

API local:

```text
http://localhost:3000
```

## Variables

Archivo local: `apps/api/.env`.

```env
PORT=3000
DATABASE_URL=postgresql://admino:admino@localhost:5432/admino_dev
JWT_SECRET=dev-secret-change-in-production
CORS_ORIGIN=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:5173
```

`CORS_ALLOWED_ORIGINS` acepta varios orígenes separados por comas y aplica también para sockets. `FRONTEND_URL` se usa para links como reset de contraseña.

## Base de datos

Postgres local con Docker:

```bash
docker compose up -d
npm run prisma:migrate
npm run prisma:generate
```

## Checks

Desde la raíz:

```bash
npm run type-check:api
npm run build:api
```

Desde `apps/api`:

```bash
npm run type-check
npm run build
```

## Estructura

```text
apps/api/
├── prisma/
├── scripts/
├── src/
│   ├── app.ts
│   ├── index.ts
│   ├── config/
│   ├── lib/
│   ├── middleware/
│   ├── routes/
│   └── types/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```
