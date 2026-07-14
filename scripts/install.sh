#!/bin/bash
# SXB VPN Installation Script
# Run this script on a fresh VPS to set up the entire platform

set -e

echo "========================================"
echo "  SXB VPN Installation Script"
echo "========================================"
echo ""

DB_NAME="sxbvpn"
DB_USER="sxbvpn_user"
DB_PASS="sxbvpn_pass_2024"
BACKEND_DIR="/home/ubuntu/sxb-vpn"

echo "[1/10] Updating system..."
apt-get update && apt-get upgrade -y

echo "[2/10] Installing required packages..."
apt-get install -y curl wget git nginx certbot python3-certbot-nginx postgresql postgresql-contrib redis-server

echo "[3/10] Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "[4/10] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "[5/10] Cloning repository..."
cd /home/ubuntu
git clone https://github.com/AbakoDolla/stuff-the-vpn.git sxb-vpn
cd $BACKEND_DIR/apps/backend

echo "[6/10] Installing dependencies..."
npm install
npx prisma generate

echo "[7/10] Configuring environment..."
cat > .env << ENVEOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
JWT_SECRET="sxb_vpn_jwt_secret_key_2024_very_secure_random_string"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=production
ENVEOF

echo "[8/10] Running database migrations..."
npx prisma db push

echo "[9/10] Building and starting backend..."
npm run build
npm install -g pm2
pm2 start dist/index.mjs --name "sxb-backend"
pm2 startup
pm2 save

echo ""
echo "========================================"
echo "  Installation Complete!"
echo "========================================"
echo "Admin login: admin@sxbvpn.com"
echo "Default password: AdminSXB2024!"
echo ""
