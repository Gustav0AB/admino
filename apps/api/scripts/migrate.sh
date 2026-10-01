#!/bin/bash
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${CYAN}[migrate]${NC} $1"; }
ok()   { echo -e "${GREEN}[ok]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

cd "$(dirname "$0")/.."

# ── Load DATABASE_URL from .env ───────────────────────────────────────────────
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep DATABASE_URL | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  err "DATABASE_URL is not set. Make sure .env exists and contains DATABASE_URL."
fi

# ── Resolve psql binary ───────────────────────────────────────────────────────
if command -v psql &>/dev/null; then
  PSQL="psql"
elif [ -x "/usr/local/Cellar/postgresql@16/16.13/bin/psql" ]; then
  PSQL="/usr/local/Cellar/postgresql@16/16.13/bin/psql"
elif [ -x "/usr/local/Cellar/postgresql@15/15.14/bin/psql" ]; then
  PSQL="/usr/local/Cellar/postgresql@15/15.14/bin/psql"
else
  err "psql not found. Install PostgreSQL client tools or add psql to your PATH."
fi

# ── 1. Generate Prisma client from latest schema ──────────────────────────────
log "Generating Prisma client..."
npx prisma generate
ok "Prisma client generated"

# ── 2. Compute diff between DB and schema ─────────────────────────────────────
log "Computing schema diff..."

# Get current DB state as SQL
CURRENT_SQL=$(npx prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --script 2>/dev/null || true)

if [ -z "$CURRENT_SQL" ] || echo "$CURRENT_SQL" | grep -q "^-- This is an empty migration"; then
  ok "Database is already up to date — no changes needed."
  exit 0
fi

# ── 3. Preview changes ────────────────────────────────────────────────────────
log "Pending changes:"
echo ""
echo "$CURRENT_SQL"
echo ""

# ── 4. Confirm before applying ───────────────────────────────────────────────
if [ "${1}" != "--yes" ] && [ "${1}" != "-y" ]; then
  read -rp "Apply these changes to $DATABASE_URL? [y/N] " confirm
  case "$confirm" in
    [yY][eE][sS]|[yY]) ;;
    *) warn "Aborted — no changes made."; exit 0 ;;
  esac
fi

# ── 5. Apply via psql ─────────────────────────────────────────────────────────
log "Applying migration..."
echo "$CURRENT_SQL" | "$PSQL" "$DATABASE_URL"
ok "Migration applied"

# ── 6. Seed prompt ────────────────────────────────────────────────────────────
if [ "${1}" != "--yes" ] && [ "${1}" != "-y" ]; then
  read -rp "Run seed? [y/N] " seed_confirm
  case "$seed_confirm" in
    [yY][eE][sS]|[yY])
      log "Seeding database..."
      npm run db:seed
      ok "Seed complete"
      ;;
    *)
      warn "Skipped seed."
      ;;
  esac
fi

ok "Done."
