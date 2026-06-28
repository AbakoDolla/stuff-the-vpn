#!/bin/sh
set -e

echo "[entrypoint] Waiting for PostgreSQL to be ready..."

# Extract host and port from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_PORT=${DB_PORT:-5432}
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|.*://([^:@]+).*|\1|')

MAX_RETRIES=30
RETRIES=0
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q 2>/dev/null; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo "[entrypoint] ERROR: PostgreSQL not ready after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "[entrypoint] PostgreSQL not ready (attempt $RETRIES/$MAX_RETRIES) — retrying in 2s..."
  sleep 2
done

echo "[entrypoint] PostgreSQL is ready."

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy || {
  echo "[entrypoint] WARNING: prisma migrate deploy failed (DB may already be up to date)"
}

echo "[entrypoint] Starting application..."
exec node --enable-source-maps ./dist/index.mjs
