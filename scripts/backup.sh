#!/bin/bash
# SXB VPN Backup Script
# Run this script to backup the database and important files

set -e

echo "========================================"
echo "  SXB VPN Backup Script"
echo "========================================"
echo ""

BACKUP_DIR="/root/sxb-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.tar.gz"

mkdir -p $BACKUP_DIR

echo "[1/3] Backing up PostgreSQL database..."
sudo -u postgres pg_dump sxbvpn > $BACKUP_DIR/db_backup_$DATE.sql

echo "[2/3] Backing up configuration files..."
tar -czf $BACKUP_FILE \
    /home/ubuntu/sxb-vpn/apps/backend/.env \
    /etc/nginx/sites-available/vpnsxb \
    /etc/x-ui/ \
    $BACKUP_DIR/db_backup_$DATE.sql

echo "[3/3] Cleaning old backups (keeping last 7)..."
cd $BACKUP_DIR
ls -t | tail -n +8 | xargs -r rm -rf

echo ""
echo "========================================"
echo "  Backup Complete!"
echo "========================================"
echo "Backup location: $BACKUP_FILE"
echo ""
