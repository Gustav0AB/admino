#!/bin/bash
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${CYAN}[init]${NC} $1"; }
ok()  { echo -e "${GREEN}[ok]${NC} $1"; }
err() { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ── 1. Docker ────────────────────────────────────────────────────────────────
log "Checking Docker..."
if ! command -v docker &>/dev/null; then
  err "Docker is not installed. Download Docker Desktop from https://www.docker.com/products/docker-desktop/ then re-run this script."
fi

if ! docker info &>/dev/null; then
  err "Docker is installed but not running. Open Docker Desktop and wait for it to start, then re-run this script."
fi
ok "Docker is running"

# ── 2. Node dependencies ─────────────────────────────────────────────────────
log "Installing npm dependencies..."
cd "$(dirname "$0")/.."
npm install
ok "Dependencies installed"

# ── 3. .env ──────────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  log ".env not found, copying from .env.example..."
  cp .env.example .env
  ok ".env created — review it before continuing"
else
  ok ".env already exists"
fi

# ── 4. Start Postgres ─────────────────────────────────────────────────────────
log "Starting PostgreSQL container..."
docker compose up -d postgres

log "Waiting for PostgreSQL to be ready..."
until docker exec admino-postgres pg_isready -U admino &>/dev/null; do
  sleep 1
done
ok "PostgreSQL is ready"

# ── 5. Prisma ─────────────────────────────────────────────────────────────────
log "Generating Prisma client..."
npm run prisma:generate

log "Running database migrations..."
npm run prisma:migrate

ok "All done! Run ./scripts/start.sh to start the API."
