#!/usr/bin/env bash
set -euo pipefail

# Seed all data in the correct order.
# Usage:
#   bash scripts/seed-all.sh
#   chmod +x scripts/seed-all.sh && ./scripts/seed-all.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

# Pretty logger
log() { printf "\n\e[1m▶ %s\e[0m\n" "$*"; }

trap 'echo "\n❌ Error on line $LINENO"; exit 1' ERR

# Optional: ensure Prisma Client is up to date
log "prisma generate"
npx prisma generate

# 1) Countries
log "seed.country"
time npx tsx prisma/seed.country.ts

# 2) Create admin user
log "seed.admin"
time npx tsx prisma/seed.admin.ts

printf "\n✅ All seeds completed successfully.\n"
