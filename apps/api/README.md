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
