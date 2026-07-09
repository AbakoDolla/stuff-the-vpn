#!/bin/bash
# ══════════════════════════════════════════════════════════════════
# SXB VPN - Dashboard Vercel Deployment
# 
# Usage: ./deploy-vercel.sh
# 
# Prerequisites:
# - Vercel CLI installed: npm install -g vercel
# - Vercel token set: export VERCEL_TOKEN="your_token_here"
# 
# Vercel Project Info:
# - Project ID: prj_1iWhL9WWebmNVEz1CSzgOFDR0I17
# - Team: team_MK8WuSvAOMHOaji2laSYF6jy
# ══════════════════════════════════════════════════════════════════

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ── Configuration ────────────────────────────────────────────────
VERCEL_API_URL="https://api.vercel.com/v13"
PROJECT_ID="prj_1iWhL9WWebmNVEz1CSzgOFDR0I17"
TEAM_ID="team_MK8WuSvAOMHOaji2laSYF6jy"

# Vercel token must be set in environment
if [ -z "$VERCEL_TOKEN" ]; then
    log_error "VERCEL_TOKEN environment variable is not set"
    echo ""
    echo "Please set your Vercel token:"
    echo "  export VERCEL_TOKEN=\"your_token_here\""
    echo ""
    echo "Or configure it in Vercel Dashboard:"
    echo "  Settings → Environment Variables"
    exit 1
fi

# ── Vérifications ───────────────────────────────────────────────
check_dependencies() {
    log_info "Vérification des dépendances..."
    
    if ! command -v curl &> /dev/null; then
        log_error "curl n'est pas installé"
        exit 1
    fi
    
    log_success "Dépendances vérifiées"
}

# ── Déploiement ─────────────────────────────────────────────────
deploy_dashboard() {
    log_info "Déploiement du Dashboard sur Vercel..."
    
    cd apps/dashboard
    
    # Vérifier si Vercel CLI est installé
    if ! command -v vercel &> /dev/null; then
        log_info "Installation de Vercel CLI..."
        npm install -g vercel
    fi
    
    # Se connecter à Vercel
    log_info "Connexion à Vercel..."
    echo "$VERCEL_TOKEN" | vercel login --token 2>/dev/null || true
    
    # Déployer en production
    log_info "Déploiement en production..."
    vercel --yes --prod \
        --token "$VERCEL_TOKEN" \
        --team "$TEAM_ID" \
        --project "$PROJECT_ID" \
        --env NEXT_PUBLIC_API_URL="https://api.sxbvpn.com/api" \
        --env NODE_ENV="production"
    
    cd ../..
    log_success "Dashboard déployé!"
}

# ── Configuration des variables d'environnement ──────────────────
setup_env_vars() {
    log_info "Configuration des variables d'environnement..."
    
    # Variables à configurer sur Vercel
    declare -A ENV_VARS=(
        ["NEXT_PUBLIC_API_URL"]="https://api.sxbvpn.com/api"
        ["NODE_ENV"]="production"
    )
    
    for key in "${!ENV_VARS[@]}"; do
        log_info "Variable: $key"
    done
    
    log_warn "Veuillez configurer manuellement les variables d'environnement dans le dashboard Vercel:"
    echo ""
    echo "  NEXT_PUBLIC_API_URL = https://api.sxbvpn.com/api"
    echo "  NODE_ENV = production"
    echo ""
}

# ── Main ───────────────────────────────────────────────────────
main() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║         SXB VPN - Dashboard Vercel Deployment           ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    
    check_dependencies
    setup_env_vars
    deploy_dashboard
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║              Déploiement terminé!                        ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    log_info "Dashboard: https://dashboard.sxbvpn.com"
    log_info "API Backend: https://api.sxbvpn.com"
    echo ""
}

main "$@"
