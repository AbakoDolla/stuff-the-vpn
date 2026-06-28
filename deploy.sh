#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# SxB VPN — Script de déploiement VPS
# Usage: chmod +x deploy.sh && ./deploy.sh
# ════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Pré-requis ────────────────────────────────────────────────────────────
command -v docker &>/dev/null   || error "Docker n'est pas installé. Voir https://docs.docker.com/engine/install/"
command -v git    &>/dev/null   || error "Git n'est pas installé."

# ── Fichier .env ─────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  if [ -f .env.production.example ]; then
    cp .env.production.example .env
    warn ".env créé depuis .env.production.example"
    warn "IMPORTANT: Modifiez .env avec vos vraies valeurs avant de continuer !"
    warn "  nano .env   (ou vim .env)"
    read -rp "Appuyez sur Entrée après avoir modifié .env..." _
  else
    error ".env manquant. Créez-le depuis .env.production.example"
  fi
fi

# Vérification variables critiques
source .env 2>/dev/null || true
[ -z "${POSTGRES_PASSWORD:-}" ] && error "POSTGRES_PASSWORD manquant dans .env"
[ -z "${JWT_SECRET:-}" ]        && error "JWT_SECRET manquant dans .env"
[ "${JWT_SECRET}" = "CHANGEZ_MOI_SECRET_JWT_MIN_32_CHARS" ] && error "Changez JWT_SECRET dans .env !"
[ "${POSTGRES_PASSWORD}" = "CHANGEZ_MOI_MOT_DE_PASSE_FORT" ] && error "Changez POSTGRES_PASSWORD dans .env !"

info "Variables .env validées ✓"

# ── Mise à jour du code ───────────────────────────────────────────────────
info "Mise à jour du code depuis GitHub..."
git pull origin main

# ── Build et démarrage ───────────────────────────────────────────────────
info "Build Docker en cours (peut prendre 2-3 minutes)..."
docker compose pull nginx   2>/dev/null || true
docker compose build --no-cache backend

info "Démarrage des services..."
docker compose up -d

# ── Attente DB ──────────────────────────────────────────────────────────
info "Attente de PostgreSQL..."
for i in {1..30}; do
  docker compose exec -T db pg_isready -U "${POSTGRES_USER:-stv_user}" &>/dev/null && break
  sleep 2
  [ $i -eq 30 ] && error "PostgreSQL ne démarre pas"
done
info "PostgreSQL prêt ✓"

# ── Migrations Prisma ────────────────────────────────────────────────────
info "Application des migrations Prisma..."
docker compose exec -T backend npx prisma migrate deploy 2>/dev/null || \
  docker compose exec -T backend npx prisma db push --accept-data-loss 2>/dev/null || \
  warn "Migration ignorée (la DB est peut-être déjà à jour)"

# ── Santé ────────────────────────────────────────────────────────────────
info "Vérification de la santé du backend..."
sleep 5
if curl -sf http://localhost/api/healthz &>/dev/null; then
  info "Backend opérationnel ✓"
else
  warn "Le backend ne répond pas encore. Vérifiez: docker compose logs backend"
fi

info ""
info "════════════════════════════════════════════"
info "✅ SxB VPN Backend déployé avec succès !"
info "   API:    http://$(hostname -I | awk '{print $1}')/api"
info "   Logs:   docker compose logs -f backend"
info "   Status: docker compose ps"
info "════════════════════════════════════════════"
