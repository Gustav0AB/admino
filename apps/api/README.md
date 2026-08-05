# admino-api

REST API for the Admino platform, built with **Express**, **TypeScript**, and **Prisma** (PostgreSQL).

---

## Table of Contents

- [How Docker works in this project](#how-docker-works-in-this-project)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Daily workflow](#daily-workflow)
- [Adding features](#adding-features)
- [Environment variables](#environment-variables)
- [Database](#database)

---

## How Docker works in this project

Docker lets you run software (like PostgreSQL) inside an isolated container on your machine — without installing it globally. Think of it as a lightweight virtual machine that only runs one thing.

In this project, **Docker runs PostgreSQL only**. The API itself still runs directly on your machine with `npm run start:dev`. Here is the picture:

```
Your machine
├── Node / npm   →  runs the API (ts-node-dev)
└── Docker
    └── admino-postgres container  →  runs PostgreSQL on port 5432
```

The API connects to Postgres via `DATABASE_URL=postgresql://admino:admino@localhost:5432/admino_dev`.

### Do you need Docker for the frontend?

**No.** The frontend (Expo / React Native) runs completely on your machine with `npx expo start`. It talks to the API over HTTP — it does not need a database or any container. Docker is only needed here to run Postgres for the API.

---

## Project structure

```
admino-api/
├── prisma/
│   ├── schema.prisma        # Database models
│   ├── migrations/          # Auto-generated migration files
│   └── seed.ts              # Optional seed data
├── scripts/
│   ├── init.sh              # One-time setup script
│   └── start.sh             # Daily start script
├── src/
│   ├── index.ts             # Entry point — starts the server
│   ├── app.ts               # Express app setup (middleware, routes)
│   ├── config/
│   │   └── env.ts           # Typed env variables
│   ├── lib/
│   │   └── prisma.ts        # Prisma client singleton
│   ├── middleware/          # Auth, error handling, etc.
│   ├── routes/              # Route handlers grouped by feature
│   └── types/               # Shared TypeScript types
├── .env                     # Local env vars (gitignored)
├── .env.example             # Template — safe to commit
├── docker-compose.yml       # PostgreSQL container definition
├── package.json
├── prisma.config.ts         # Prisma config (reads DATABASE_URL)
└── tsconfig.json
```

---

## Getting started

> Do this once when setting up the project for the first time.

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — must be installed and running

### 1. Run the init script

```bash
cd admino-api
./scripts/init.sh
```

This will:
1. Verify Docker is installed and running
2. Install npm dependencies (`npm install`)
3. Create `.env` from `.env.example` if it doesn't exist
4. Start the PostgreSQL container
5. Run Prisma migrations (creates all tables)
6. Generate the Prisma client

---

## Daily workflow

Every time you want to work on the API:

```bash
./scripts/start.sh
```

This will:
1. Start the Postgres container if it's not already running
2. Launch the API in dev mode with hot reload

The API will be available at `http://localhost:3000`.

### Other useful commands

| Command | What it does |
|---|---|
| `npm run prisma:migrate` | Create and apply a new migration after changing the schema |
| `npm run prisma:generate` | Regenerate the Prisma client after schema changes |
| `npm run prisma:studio` | Open Prisma Studio (visual DB browser) at localhost:5555 |
| `npm run db:seed` | Run the seed file to populate test data |
| `npm run type-check` | Run TypeScript type checking without compiling |

---

## Adding features

Follow this pattern when adding a new feature (e.g. `invoices`):

### 1. Add the model to the schema

Edit `prisma/schema.prisma` and add your new model.

### 2. Create and apply the migration

```bash
npm run prisma:migrate
# Prisma will ask for a migration name, e.g. "add_invoices"
```

This generates a SQL file in `prisma/migrations/` and applies it to your local DB.

### 3. Add the route file

Create `src/routes/invoices.ts`:

```ts
import { Router } from "express";
import { prisma } from "@lib/prisma";

const router = Router();

router.get("/", async (req, res) => {
  const invoices = await prisma.invoice.findMany();
  res.json(invoices);
});

export default router;
```

### 4. Register the route in app.ts

```ts
import invoicesRouter from "@routes/invoices";

app.use("/api/invoices", invoicesRouter);
```

### 5. Add any middleware you need

Put auth guards, validators, etc. in `src/middleware/` and apply them to the router or individual routes.

---

## Environment variables

Copy `.env.example` to `.env` and fill in your values. Never commit `.env`.

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `3000` | Port the API listens on |
| `DATABASE_URL` | see below | PostgreSQL connection string |
| `JWT_SECRET` | `dev-secret-...` | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | JWT expiry duration |
| `CORS_ORIGIN` | `http://localhost:8081` | Allowed mobile origin |
| `WEB_ORIGIN` | `http://localhost:3001` | Allowed web origin |

**Local DATABASE_URL** (matches docker-compose.yml):
```
postgresql://admino:admino@localhost:5432/admino_dev
```

---

## Database

PostgreSQL runs in a Docker container defined in `docker-compose.yml`.

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `admino_dev` |
| User | `admino` |
| Password | `admino` |

Data is persisted in a Docker volume (`admino_postgres_data`), so it survives container restarts. To wipe the database and start fresh:

```bash
docker compose down -v   # removes the volume too
./scripts/init.sh        # recreates everything
```
