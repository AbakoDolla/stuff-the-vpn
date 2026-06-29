#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# SxB VPN — Script de déploiement automatique VPS
# Fonctionne sur Ubuntu 20+, Debian 11+, CentOS 8+, Rocky Linux, AlmaLinux
# Usage: curl -fsSL https://raw.githubusercontent.com/AbakoDolla/stuff-the-vpn/main/deploy.sh | bash
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

REPO_URL="https://github.com/AbakoDolla/stuff-the-vpn.git"
INSTALL_DIR="${INSTALL_DIR:-/opt/sxbvpn}"

# ── Bannière ───────────────────────────────────────────────────────────────────
echo -e "${BOLD}${BLUE}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║       SxB VPN — Auto Deploy v1.0      ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

# ── Détection OS ───────────────────────────────────────────────────────────────
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
  elif [ -f /etc/redhat-release ]; then
    OS="centos"
  else
    error "OS non supporté. Utilisez Ubuntu 20+, Debian 11+, CentOS 8+ ou Rocky Linux."
  fi
  info "OS détecté: $OS $OS_VERSION"
}

# ── Installation Docker ────────────────────────────────────────────────────────
install_docker() {
  if command -v docker &>/dev/null; then
    success "Docker déjà installé: $(docker --version)"
    return
  fi
  info "Installation de Docker..."
  case "$OS" in
    ubuntu|debian)
      apt-get update -qq
      apt-get install -y -qq ca-certificates curl gnupg lsb-release git
      install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      chmod a+r /etc/apt/keyrings/docker.gpg
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/$OS $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list
      apt-get update -qq
      apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
      ;;
    centos|rhel|rocky|almalinux|fedora)
      dnf install -y -q curl git
      curl -fsSL https://get.docker.com | sh
      ;;
    *)
      curl -fsSL https://get.docker.com | sh
      ;;
  esac
  systemctl enable --now docker
  success "Docker installé: $(docker --version)"
}

# ── Docker Compose ─────────────────────────────────────────────────────────────
ensure_compose() {
  if docker compose version &>/dev/null 2>&1; then
    success "Docker Compose v2 disponible"
    COMPOSE_CMD="docker compose"
  elif command -v docker-compose &>/dev/null; then
    success "Docker Compose v1 disponible"
    COMPOSE_CMD="docker-compose"
  else
    info "Installation de Docker Compose..."
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
    curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-$(uname -m)" \
      -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    COMPOSE_CMD="docker-compose"
    success "Docker Compose installé"
  fi
}

# ── Détection IP ───────────────────────────────────────────────────────────────
detect_ip() {
  PUBLIC_IP=$(curl -4 -fsSL https://api.ipify.org 2>/dev/null || \
              curl -4 -fsSL https://ifconfig.me 2>/dev/null || \
              ip route get 8.8.8.8 | awk '{print $7}' | head -1)
  echo "$PUBLIC_IP"
}

# ── Génération de secrets ──────────────────────────────────────────────────────
gen_secret() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9!@#%^&*' | head -c 48; }
gen_key32()  { openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | head -c 32; }
gen_pass()   { openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 20; }

# ── Clone / Update du repo ─────────────────────────────────────────────────────
setup_repo() {
  if [ -d "$INSTALL_DIR/.git" ]; then
    info "Mise à jour du dépôt..."
    git -C "$INSTALL_DIR" pull origin main
  else
    info "Clonage du dépôt dans $INSTALL_DIR..."
    mkdir -p "$(dirname "$INSTALL_DIR")"
    git clone "$REPO_URL" "$INSTALL_DIR"
  fi
  success "Code à jour"
}

# ── Configuration interactive ──────────────────────────────────────────────────
configure() {
  local detected_ip
  detected_ip=$(detect_ip)

  echo ""
  echo -e "${BOLD}━━━ Configuration SxB VPN ━━━${NC}"
  echo ""

  # IP / Domaine
  read -rp "$(echo -e "${YELLOW}IP ou domaine du VPS${NC} [${detected_ip}]: ")" SERVER_HOST
  SERVER_HOST="${SERVER_HOST:-$detected_ip}"

  # Port backend
  read -rp "$(echo -e "${YELLOW}Port du backend${NC} [4000]: ")" BACKEND_PORT
  BACKEND_PORT="${BACKEND_PORT:-4000}"

  # Port dashboard
  read -rp "$(echo -e "${YELLOW}Port du dashboard${NC} [3000]: ")" DASHBOARD_PORT
  DASHBOARD_PORT="${DASHBOARD_PORT:-3000}"

  # Admin
  read -rp "$(echo -e "${YELLOW}Email admin${NC} [admin@sxbvpn.com]: ")" ADMIN_EMAIL
  ADMIN_EMAIL="${ADMIN_EMAIL:-admin@sxbvpn.com}"

  read -rsp "$(echo -e "${YELLOW}Mot de passe admin${NC} [généré]: ")" ADMIN_PASSWORD
  echo ""
  ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(gen_pass)}"

  # Génération des secrets
  JWT_SECRET=$(gen_secret)
  ENCRYPTION_KEY=$(gen_key32)
  REDIS_PASSWORD=$(gen_pass)
  POSTGRES_PASSWORD=$(gen_pass)

  API_URL="http://${SERVER_HOST}:${BACKEND_PORT}/api"
  DASHBOARD_URL="http://${SERVER_HOST}:${DASHBOARD_PORT}"
}

# ── Création du .env ───────────────────────────────────────────────────────────
create_env() {
  info "Création du fichier .env..."
  cat > "$INSTALL_DIR/.env" << EOF
# ── Généré automatiquement par deploy.sh le $(date) ──

# Serveur
SERVER_HOST=${SERVER_HOST}
NODE_ENV=production

# Backend
PORT=${BACKEND_PORT}
CORS_ORIGIN=*

# Base de données
POSTGRES_USER=sxbvpn
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=sxbvpn
DATABASE_URL=postgresql://sxbvpn:${POSTGRES_PASSWORD}@postgres:5432/sxbvpn

# Redis
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# JWT & Sécurité
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Admin initial
SEED_ADMIN_EMAIL=${ADMIN_EMAIL}
SEED_ADMIN_USERNAME=superadmin
SEED_ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# Dashboard
NEXT_PUBLIC_API_URL=${API_URL}
NEXTAUTH_SECRET=${JWT_SECRET}
NEXTAUTH_URL=${DASHBOARD_URL}
DOMAIN=${SERVER_HOST}

# V2Ray (optionnel)
V2RAY_API_URL=http://127.0.0.1:10085
V2RAY_API_ENABLED=false
TRAFFIC_SYNC_INTERVAL_MS=60000
EOF
  chmod 600 "$INSTALL_DIR/.env"
  success ".env créé"
}

# ── Mise à jour docker-compose.yml pour les ports configurés ──────────────────
patch_compose() {
  cd "$INSTALL_DIR"
  # Remplace les ports si différents des défauts
  if [ "$BACKEND_PORT" != "4000" ]; then
    sed -i "s/\"4000:4000\"/\"${BACKEND_PORT}:4000\"/g" docker-compose.yml
  fi
  if [ "$DASHBOARD_PORT" != "3000" ]; then
    sed -i "s/\"3000:3000\"/\"${DASHBOARD_PORT}:3000\"/g" docker-compose.yml
  fi
}

# ── Déploiement ────────────────────────────────────────────────────────────────
deploy() {
  cd "$INSTALL_DIR"
  info "Construction des images Docker..."
  $COMPOSE_CMD build --parallel

  info "Démarrage des services (PostgreSQL, Redis)..."
  $COMPOSE_CMD up -d postgres redis
  info "Attente que la DB soit prête..."
  sleep 15

  info "Démarrage du backend..."
  $COMPOSE_CMD up -d backend
  sleep 8

  info "Démarrage du dashboard..."
  $COMPOSE_CMD up -d dashboard
  sleep 5

  # Nginx (optionnel)
  if [ -f nginx/nginx.conf ]; then
    info "Démarrage de Nginx..."
    $COMPOSE_CMD up -d nginx || warn "Nginx non démarré (port 80 peut-être occupé)"
  fi

  success "Tous les services sont démarrés"
}

# ── Vérification santé ─────────────────────────────────────────────────────────
healthcheck() {
  info "Vérification de la santé des services..."
  sleep 10

  local max=30 attempt=0 healthy=false
  while [ $attempt -lt $max ]; do
    if curl -fsS "http://localhost:${BACKEND_PORT}/api/health" &>/dev/null; then
      healthy=true; break
    fi
    attempt=$((attempt+1))
    sleep 2
    echo -n "."
  done
  echo ""

  if $healthy; then
    success "Backend opérationnel sur le port ${BACKEND_PORT}"
  else
    warn "Backend pas encore prêt. Vérifiez: $COMPOSE_CMD logs backend"
  fi
}

# ── Configuration du firewall ──────────────────────────────────────────────────
setup_firewall() {
  if command -v ufw &>/dev/null; then
    ufw allow "$BACKEND_PORT"/tcp &>/dev/null || true
    ufw allow "$DASHBOARD_PORT"/tcp &>/dev/null || true
    ufw allow 80/tcp &>/dev/null || true
    ufw allow 443/tcp &>/dev/null || true
    success "Firewall UFW configuré"
  elif command -v firewall-cmd &>/dev/null; then
    firewall-cmd --permanent --add-port="$BACKEND_PORT"/tcp &>/dev/null || true
    firewall-cmd --permanent --add-port="$DASHBOARD_PORT"/tcp &>/dev/null || true
    firewall-cmd --reload &>/dev/null || true
    success "Firewall firewalld configuré"
  fi
}

# ── Résumé final ───────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${GREEN}  ✅  SxB VPN déployé avec succès !${NC}"
  echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${BOLD}URLs:${NC}"
  echo -e "  • API Backend    : ${BLUE}${API_URL}${NC}"
  echo -e "  • Dashboard      : ${BLUE}${DASHBOARD_URL}${NC}"
  echo ""
  echo -e "  ${BOLD}Identifiants admin:${NC}"
  echo -e "  • Email          : ${YELLOW}${ADMIN_EMAIL}${NC}"
  echo -e "  • Mot de passe   : ${YELLOW}${ADMIN_PASSWORD}${NC}"
  echo ""
  echo -e "  ${BOLD}Commandes utiles:${NC}"
  echo -e "  • Voir les logs  : cd ${INSTALL_DIR} && $COMPOSE_CMD logs -f"
  echo -e "  • Redémarrer     : cd ${INSTALL_DIR} && $COMPOSE_CMD restart"
  echo -e "  • Arrêter        : cd ${INSTALL_DIR} && $COMPOSE_CMD down"
  echo -e "  • Mettre à jour  : cd ${INSTALL_DIR} && git pull && $COMPOSE_CMD up -d --build"
  echo ""
  echo -e "  ${BOLD}Configuration APK Flutter:${NC}"
  echo -e "  • Ajouter dans GitHub Actions Variables:"
  echo -e "    BACKEND_URL = ${BLUE}${API_URL}${NC}"
  echo -e "    NEXT_PUBLIC_API_URL = ${BLUE}${API_URL}${NC}"
  echo ""
  echo -e "  ${BOLD}Fichier .env:${NC} ${INSTALL_DIR}/.env"
  echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════${NC}"
}

# ── Point d'entrée ─────────────────────────────────────────────────────────────
main() {
  [ "$EUID" -ne 0 ] && error "Ce script doit être exécuté en tant que root (sudo bash deploy.sh)"

  detect_os
  install_docker
  ensure_compose

  command -v openssl &>/dev/null || {
    case "$OS" in
      ubuntu|debian) apt-get install -y -qq openssl ;;
      *) dnf install -y -q openssl ;;
    esac
  }

  setup_repo
  configure
  create_env
  patch_compose
  setup_firewall
  deploy
  healthcheck
  print_summary
}

main "$@"
