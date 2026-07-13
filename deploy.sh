#!/bin/bash

# SXB VPN - Automated Deployment Script
# Usage: ./deploy.sh [backend|dashboard|mobile|all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

deploy_backend() {
  log_info "Building Backend..."
  cd apps/backend
  
  # Check dependencies
  if [ ! -d "node_modules" ]; then
    log_info "Installing backend dependencies..."
    npm install
  fi
  
  # Build
  npm run build
  log_success "Backend built successfully"
  
  log_info "Starting backend..."
  npm start &
  BACKEND_PID=$!
  log_success "Backend started with PID $BACKEND_PID"
  
  cd ../..
}

deploy_dashboard() {
  log_info "Building Dashboard..."
  cd apps/dashboard
  
  # Check dependencies
  if [ ! -d "node_modules" ]; then
    log_info "Installing dashboard dependencies..."
    npm install
  fi
  
  # Check .env.local
  if [ ! -f ".env.local" ]; then
    log_warning ".env.local not found, creating from example..."
    cp .env.example .env.local
    sed -i 's|http://localhost:5000/api|http://localhost:4000/api|g' .env.local
  fi
  
  # Build
  npm run build
  log_success "Dashboard built successfully"
  
  log_info "Starting dashboard..."
  npm start &
  DASHBOARD_PID=$!
  log_success "Dashboard started with PID $DASHBOARD_PID"
  
  cd ../..
}

deploy_mobile() {
  log_info "Building Mobile APK..."
  cd apps/mobile
  
  # Check Flutter
  if ! command -v flutter &> /dev/null; then
    log_error "Flutter is not installed. Please install Flutter first."
    exit 1
  fi
  
  # Check dependencies
  log_info "Getting Flutter dependencies..."
  flutter pub get
  
  # Build APK
  log_info "Building release APK..."
  flutter build apk --release
  
  log_success "APK built successfully"
  log_info "Output: build/app/outputs/flutter-apk/app-release.apk"
  
  cd ../..
}

show_status() {
  echo ""
  echo "====================================="
  echo "  SXB VPN Deployment Status"
  echo "====================================="
  echo ""
  log_success "Backend:  Running"
  log_success "Dashboard: Ready to access at http://localhost:3000"
  log_success "Mobile APK: Built and ready for distribution"
  echo ""
  echo "Login Credentials:"
  echo "  Email: admin@sxbvpn.com"
  echo "  Password: SxBvpn2026!"
  echo ""
  echo "====================================="
}

# Main
case "${1:-all}" in
  backend)
    deploy_backend
    ;;
  dashboard)
    deploy_dashboard
    ;;
  mobile)
    deploy_mobile
    ;;
  all)
    deploy_backend
    sleep 2
    deploy_dashboard
    sleep 2
    deploy_mobile
    show_status
    ;;
  *)
    log_error "Unknown option: $1"
    echo "Usage: $0 [backend|dashboard|mobile|all]"
    exit 1
    ;;
esac

log_success "Deployment completed!"
