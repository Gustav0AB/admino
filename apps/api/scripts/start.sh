#!/bin/bash
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${CYAN}[start]${NC} $1"; }
ok()  { echo -e "${GREEN}[ok]${NC} $1"; }
err() { echo -e "${RED}[error]${NC} $1"; exit 1; }

cd "$(dirname "$0")/.."

# ── 1. Docker ─────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  err "Docker is not installed. Run ./scripts/init.sh first."
fi

if ! docker info &>/dev/null; then
  err "Docker is not running. Open Docker Desktop and wait for it to start."
fi

# ── 2. Postgres ───────────────────────────────────────────────────────────────
if [ "$(docker inspect -f '{{.State.Running}}' admino-postgres 2>/dev/null)" != "true" ]; then
  log "Starting PostgreSQL container..."
  docker compose up -d postgres

  log "Waiting for PostgreSQL to be ready..."
  until docker exec admino-postgres pg_isready -U admino &>/dev/null; do
    sleep 1
  done
else
  ok "PostgreSQL already running"
fi

# ── 3. Start API ──────────────────────────────────────────────────────────────
log "Starting API in dev mode..."
npm run start:dev
