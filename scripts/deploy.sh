#!/bin/bash
# SXB VPN Deployment Script
# Run this script to deploy updates to the VPS

set -e

echo "========================================"
echo "  SXB VPN Deployment Script"
echo "========================================"
echo ""

BACKEND_DIR="/home/ubuntu/sxb-vpn/apps/backend"

echo "[1/5] Pulling latest changes..."
cd $BACKEND_DIR
git pull

echo "[2/5] Installing dependencies..."
npm install

echo "[3/5] Generating Prisma client..."
npx prisma generate

echo "[4/5] Building backend..."
npm run build

echo "[5/5] Restarting backend..."
pm2 restart sxb-backend

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
