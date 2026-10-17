#!/usr/bin/env bash
set -e

# Load DB URL from .env.local if present and not already set
if [ -z "$SUPABASE_DB_URL" ] && [ -f ".env.local" ]; then
  SUPABASE_DB_URL=$(grep "^SUPABASE_DB_URL=" .env.local | cut -d= -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "⚠️  SUPABASE_DB_URL is not set."
  echo "You can set it in .env.local as:"
  echo 'SUPABASE_DB_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"'
  echo ""
  read -sp "Or paste your Supabase DB connection URI now: " SUPABASE_DB_URL
  echo ""
fi

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ Error: Connection URL cannot be empty."
  exit 1
fi

mkdir -p backups

TIMESTAMP=$(date +'%Y-%m-%d_%H%M%S')
BACKUP_FILE="backups/dhikrly_backup_${TIMESTAMP}.sql"

echo "⏳ Backing up Supabase database (public + auth schemas)..."

pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --schema=auth \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -f "$BACKUP_FILE"

echo "🗜️ Compressing backup file..."
gzip -9 "$BACKUP_FILE"

echo ""
echo "✅ Database backup complete!"
echo "📁 Saved to: ${BACKUP_FILE}.gz"
ls -lh "${BACKUP_FILE}.gz"
