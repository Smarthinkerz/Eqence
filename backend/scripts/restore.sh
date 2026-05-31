#!/bin/bash
# Eqence Database Restore Script
# Usage: ./scripts/restore.sh path/to/backup.sql.gz

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore.sh <backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "[Restore] Error: File not found: $BACKUP_FILE"
  exit 1
fi

echo "[Restore] WARNING: This will overwrite the current database!"
read -p "Are you sure? (y/N): " confirm
if [ "$confirm" != "y" ]; then
  echo "[Restore] Cancelled."
  exit 0
fi

echo "[Restore] Restoring from: $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | docker exec -i eqence-db psql -U eqence eqence

echo "[Restore] Database restored successfully."
