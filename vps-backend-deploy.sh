#!/bin/bash

################################################################################
#                                                                              #
#         SXB VPN Backend Deployment Script                                   #
#         Run this script on your VPS to deploy the backend                   #
#                                                                              #
#         Usage: bash vps-backend-deploy.sh                                   #
#                                                                              #
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO_DIR="/home/ubuntu/stuff-the-vpn"
BACKEND_DIR="$REPO_DIR/apps/backend"
BACKEND_PORT=4000

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║      SXB VPN Backend Deployment Script                            ║"
echo "║      VPS: 141.95.112.93 | Port: 4000                             ║"
echo "╚════════════════════════════════════════════════════════════════════╝"

echo ""
log_info "Starting backend deployment..."

# Step 1: Check if running as ubuntu user
echo ""
log_info "Step 1: Checking environment..."
CURRENT_USER=$(whoami)
if [ "$CURRENT_USER" != "ubuntu" ] && [ "$CURRENT_USER" != "root" ]; then
    log_error "Please run this script as ubuntu or root user"
    exit 1
fi
log_success "Running as: $CURRENT_USER"

# Step 2: Clone or update repository
echo ""
log_info "Step 2: Updating repository..."
if [ ! -d "$REPO_DIR" ]; then
    log_warning "Repository not found, cloning..."
    cd /home/ubuntu
    git clone https://github.com/AbakoDolla/stuff-the-vpn.git
    log_success "Repository cloned"
else
    log_success "Repository exists"
fi

cd "$REPO_DIR"
log_info "Pulling latest changes from branch v0/abakodolla-bc913eef..."
git fetch origin
git pull origin v0/abakodolla-bc913eef
log_success "Repository updated"

# Step 3: Navigate to backend
echo ""
log_info "Step 3: Setting up backend directory..."
cd "$BACKEND_DIR"
log_success "Backend directory: $(pwd)"

# Step 4: Stop existing backend
echo ""
log_info "Step 4: Stopping existing backend..."
if pgrep -f "npm start" > /dev/null; then
    log_warning "Killing existing backend processes..."
    pkill -f "npm start" || true
    sleep 2
    log_success "Existing processes stopped"
else
    log_warning "No existing backend process found"
fi

# Step 5: Install dependencies
echo ""
log_info "Step 5: Installing dependencies..."
npm install --production
log_success "Dependencies installed"

# Step 6: Build backend
echo ""
log_info "Step 6: Building backend..."
npm run build
log_success "Backend built successfully"

# Step 7: Create/Update .env file
echo ""
log_info "Step 7: Configuring environment..."
if [ ! -f ".env" ]; then
    cat > .env << 'ENV'
PORT=4000
NODE_ENV=production
DATABASE_URL=postgresql://sxbvpn:sxbvpn_secret@localhost:5432/sxbvpn
JWT_SECRET=sxbvpn_super_secret_jwt_key_min_32_chars_production
CORS_ORIGIN=*
ADMIN_EMAIL=admin@sxbvpn.com
ADMIN_PASSWORD=SxBvpn2026!
LOG_LEVEL=info
ENV
    log_success ".env file created"
else
    log_warning ".env file already exists (not overwriting)"
fi

# Step 8: Start backend
echo ""
log_info "Step 8: Starting backend..."
nohup npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/backend.pid
log_success "Backend started with PID: $BACKEND_PID"

# Step 9: Verify backend
echo ""
log_info "Step 9: Verifying backend..."
sleep 3

if ps -p $BACKEND_PID > /dev/null 2>&1; then
    log_success "Backend process is running"
else
    log_error "Backend process failed to start!"
    log_error "Checking logs..."
    tail -50 /tmp/backend.log
    exit 1
fi

# Step 10: Check port
echo ""
log_info "Step 10: Checking port $BACKEND_PORT..."
if netstat -tuln 2>/dev/null | grep -q ":$BACKEND_PORT "; then
    log_success "Backend is listening on port $BACKEND_PORT"
else
    log_warning "Port $BACKEND_PORT not yet listening (may take a moment)"
fi

# Final status
echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                  ✓ DEPLOYMENT SUCCESSFUL                           ║"
echo "╠════════════════════════════════════════════════════════════════════╣"
echo "║                                                                    ║"
echo "║  Backend URL:  http://141.95.112.93:4000                          ║"
echo "║  Backend PID:  $BACKEND_PID                                              ║"
echo "║  Log File:     /tmp/backend.log                                    ║"
echo "║                                                                    ║"
echo "║  Test the backend:                                                 ║"
echo "║  curl http://141.95.112.93:4000/health                            ║"
echo "║                                                                    ║"
echo "║  View logs:                                                        ║"
echo "║  tail -f /tmp/backend.log                                          ║"
echo "║                                                                    ║"
echo "║  Stop backend:                                                     ║"
echo "║  pkill -f 'npm start'                                              ║"
echo "║                                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"

exit 0
