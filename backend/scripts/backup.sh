#!/bin/bash
# Eqence Database Backup Script
# Usage: ./scripts/backup.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/eqence_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[Backup] Starting database backup..."
docker exec eqence-db pg_dump -U eqence eqence | gzip > "$BACKUP_FILE"

echo "[Backup] Backup saved to: $BACKUP_FILE"
echo "[Backup] Size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Keep only last 30 backups
ls -t ${BACKUP_DIR}/eqence_backup_*.sql.gz | tail -n +31 | xargs -r rm
echo "[Backup] Cleanup complete. Keeping last 30 backups."
