#!/bin/bash
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${CYAN}[cleanup]${NC} $1"; }
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

# ── Mode: --hard drops and recreates the schema, default truncates data ───────
HARD=false
SEED=true

for arg in "$@"; do
  case "$arg" in
    --hard)   HARD=true ;;
    --no-seed) SEED=false ;;
    --yes|-y) SKIP_CONFIRM=true ;;
  esac
done

# ── Confirm ───────────────────────────────────────────────────────────────────
if [ "$HARD" = true ]; then
  warn "HARD cleanup: this will DROP all tables and re-apply the full schema."
else
  warn "This will TRUNCATE all data from every table (structure is kept)."
fi

if [ "${SKIP_CONFIRM}" != "true" ]; then
  read -rp "Continue against $DATABASE_URL? [y/N] " confirm
  case "$confirm" in
    [yY][eE][sS]|[yY]) ;;
    *) warn "Aborted — no changes made."; exit 0 ;;
  esac
fi

# ── Hard cleanup: drop public schema and rebuild ──────────────────────────────
if [ "$HARD" = true ]; then
  log "Dropping public schema..."
  "$PSQL" "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
  ok "Schema dropped"

  log "Re-applying schema from Prisma..."
  npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script 2>/dev/null \
    | "$PSQL" "$DATABASE_URL"
  ok "Schema recreated"

# ── Soft cleanup: truncate all tables in dependency order ────────────────────
else
  log "Truncating all tables..."
  "$PSQL" "$DATABASE_URL" <<'SQL'
TRUNCATE TABLE
  audit_logs,
  notifications,
  invitations,
  client_role_members,
  plan_assignments,
  user_expenses,
  client_roles,
  clients,
  plans,
  org_members,
  organizations,
  system_admins
CASCADE;
SQL
  ok "All tables truncated"
fi

# ── Seed ─────────────────────────────────────────────────────────────────────
if [ "$SEED" = true ]; then
  log "Seeding database..."
  npm run db:seed
  ok "Seed complete"
else
  warn "Skipped seed (--no-seed)."
fi

ok "Done."
