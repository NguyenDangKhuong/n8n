#!/bin/bash
# n8n Backup Export Script
# Export workflows, credentials, DB dump, n8n_data, redis_data into backup/
# Usage: ./backup.sh
# Total size: ~1-2MB (lightweight, safe for git)

set -e

BACKUP_DIR="./backup"
N8N_CONTAINER="n8n-test"
PG_CONTAINER="n8n-postgres-1"
PG_USER="n8n_test"
PG_DB="n8n_test"

echo "🔄 n8n Backup — $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================="

mkdir -p "$BACKUP_DIR"

# 1. Workflows (via n8n CLI — best method)
echo "📋 Exporting workflows..."
docker exec "$N8N_CONTAINER" n8n export:workflow --all --output=/home/node/.n8n/wf.json 2>/dev/null
docker cp "$N8N_CONTAINER":/home/node/.n8n/wf.json "$BACKUP_DIR/workflows.json"
docker exec "$N8N_CONTAINER" rm -f /home/node/.n8n/wf.json
WF=$(python3 -c "import json; print(len(json.load(open('$BACKUP_DIR/workflows.json'))))" 2>/dev/null || echo "?")
echo "   ✅ $WF workflows ($(du -sh $BACKUP_DIR/workflows.json | cut -f1))"

# 2. Credentials (via n8n CLI)
echo "🔑 Exporting credentials..."
if docker exec "$N8N_CONTAINER" n8n export:credentials --all --output=/home/node/.n8n/cred.json 2>/dev/null; then
  docker cp "$N8N_CONTAINER":/home/node/.n8n/cred.json "$BACKUP_DIR/credentials.json"
  docker exec "$N8N_CONTAINER" rm -f /home/node/.n8n/cred.json
  CRED=$(python3 -c "import json; print(len(json.load(open('$BACKUP_DIR/credentials.json'))))" 2>/dev/null || echo "?")
  echo "   ✅ $CRED credentials"
else
  echo "   ⚠️  No credentials found (table empty)"
  echo "[]" > "$BACKUP_DIR/credentials.json"
fi

# 3. Full PostgreSQL dump
echo "💾 Exporting database..."
docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" --clean --if-exists > "$BACKUP_DIR/db_dump.sql" 2>/dev/null
echo "   ✅ db_dump.sql ($(du -sh $BACKUP_DIR/db_dump.sql | cut -f1))"

# 4. n8n_data (settings, SSH keys — small)
echo "📁 Copying n8n_data..."
rm -rf "$BACKUP_DIR/n8n_data" 2>/dev/null
cp -r ./n8n_data/ "$BACKUP_DIR/n8n_data/" 2>/dev/null || true
echo "   ✅ n8n_data ($(du -sh $BACKUP_DIR/n8n_data/ 2>/dev/null | cut -f1 || echo '0K'))"

# 5. redis_data
echo "📁 Copying redis_data..."
rm -rf "$BACKUP_DIR/redis_data" 2>/dev/null
cp -r ./redis_data/ "$BACKUP_DIR/redis_data/" 2>/dev/null || true
echo "   ✅ redis_data ($(du -sh $BACKUP_DIR/redis_data/ 2>/dev/null | cut -f1 || echo '0K'))"

# 6. .env (CRITICAL — contains encryption key)
echo "🔐 Copying .env..."
cp .env "$BACKUP_DIR/env.backup"
echo "   ✅ env.backup"

# Summary
echo ""
echo "================================="
echo "✅ Backup complete!"
echo "================================="
ls -lh "$BACKUP_DIR/"
echo ""
echo "📦 Total: $(du -sh $BACKUP_DIR/ | cut -f1)"
echo ""
echo "⚠️  env.backup chứa N8N_ENCRYPTION_KEY"
echo "   Mất key = mất credentials. KHÔNG XÓA file này!"
