#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# SxB VPN — Script de déploiement automatique VPS v2.0
# Fonctionne sur Ubuntu 20+, Debian 11+, CentOS 8+, Rocky Linux, AlmaLinux
# Usage: curl -fsSL https://raw.githubusercontent.com/AbakoDolla/stuff-the-vpn/main/deploy.sh | bash
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
step()    { echo -e "\n${BOLD}${BLUE}▶ $*${NC}"; }

REPO_URL="https://github.com/AbakoDolla/stuff-the-vpn.git"
INSTALL_DIR="${INSTALL_DIR:-/opt/sxbvpn}"
COMPOSE_CMD=""

# ── Bannière ───────────────────────────────────────────────────────────────────
print_banner() {
  echo -e "${BOLD}${BLUE}"
  echo "  ╔═══════════════════════════════════════════╗"
  echo "  ║     SxB VPN — Auto Deploy v2.0            ║"
  echo "  ║     Nginx · Backend · Dashboard · DB       ║"
  echo "  ╚═══════════════════════════════════════════╝"
  echo -e "${NC}"
}

# ── Détection OS ───────────────────────────────────────────────────────────────
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID; OS_VERSION=$VERSION_ID
  elif [ -f /etc/redhat-release ]; then
    OS="centos"; OS_VERSION="8"
  else
    error "OS non supporté. Utilisez Ubuntu 20+, Debian 11+, CentOS 8+ ou Rocky Linux."
  fi
  info "OS détecté: $OS $OS_VERSION"
}

# ── Dépendances système ────────────────────────────────────────────────────────
install_deps() {
  case "$OS" in
    ubuntu|debian)
      apt-get update -qq
      apt-get install -y -qq ca-certificates curl gnupg lsb-release git openssl wget 2>/dev/null
      ;;
    centos|rhel|rocky|almalinux|fedora)
      dnf install -y -q curl git openssl wget 2>/dev/null
      ;;
    *)
      command -v curl &>/dev/null || error "curl requis"
      ;;
  esac
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
      install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      chmod a+r /etc/apt/keyrings/docker.gpg
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/$OS $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list
      apt-get update -qq
      apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
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
    warn "Docker Compose v1 détecté (v2 recommandé)"
    COMPOSE_CMD="docker-compose"
  else
    info "Installation de Docker Compose v2..."
    local ver
    ver=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
    curl -SL "https://github.com/docker/compose/releases/download/${ver}/docker-compose-linux-$(uname -m)" \
      -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    COMPOSE_CMD="docker-compose"
    success "Docker Compose installé"
  fi
}

# ── Détection IP publique ──────────────────────────────────────────────────────
detect_ip() {
  curl -4 -fsSL --connect-timeout 5 https://api.ipify.org 2>/dev/null || \
  curl -4 -fsSL --connect-timeout 5 https://ifconfig.me  2>/dev/null || \
  ip route get 8.8.8.8 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -1 || \
  echo "localhost"
}

# ── Génération de secrets ──────────────────────────────────────────────────────
gen_secret() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9!@#%^&*' | head -c 48; }
gen_key32()  { openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | head -c 32; }
gen_pass()   { openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 20; }

# ── Clone ou mise à jour du repo ───────────────────────────────────────────────
setup_repo() {
  if [ -d "$INSTALL_DIR/.git" ]; then
    info "Mise à jour du dépôt..."
    git -C "$INSTALL_DIR" fetch origin main
    git -C "$INSTALL_DIR" reset --hard origin/main
  else
    info "Clonage du dépôt dans $INSTALL_DIR..."
    mkdir -p "$(dirname "$INSTALL_DIR")"
    git clone "$REPO_URL" "$INSTALL_DIR"
  fi
  success "Code à jour ($(git -C "$INSTALL_DIR" log -1 --format='%h %s'))"
}

# ── Configuration interactive ──────────────────────────────────────────────────
configure_fresh() {
  local detected_ip
  detected_ip=$(detect_ip)

  echo ""
  echo -e "${BOLD}━━━ Configuration SxB VPN ━━━${NC}"
  echo ""

  read -rp "$(echo -e "${YELLOW}IP ou domaine du VPS${NC} [${detected_ip}]: ")" SERVER_HOST
  SERVER_HOST="${SERVER_HOST:-$detected_ip}"

  read -rp "$(echo -e "${YELLOW}Email admin${NC} [admin@sxbvpn.com]: ")" ADMIN_EMAIL
  ADMIN_EMAIL="${ADMIN_EMAIL:-admin@sxbvpn.com}"

  read -rsp "$(echo -e "${YELLOW}Mot de passe admin${NC} [généré]: ")" ADMIN_PASSWORD
  echo ""
  ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(gen_pass)}"

  JWT_SECRET=$(gen_secret)
  ENCRYPTION_KEY=$(gen_key32)
  REDIS_PASSWORD=$(gen_pass)
  POSTGRES_PASSWORD=$(gen_pass)
  NEXTAUTH_SECRET=$(gen_secret)
}

# ── Lecture config existante ───────────────────────────────────────────────────
load_existing_config() {
  info "Configuration existante détectée — chargement..."
  # shellcheck disable=SC1090
  set -o allexport
  source "$INSTALL_DIR/.env"
  set +o allexport

  # Recomposer les variables locales depuis le .env
  SERVER_HOST="${SERVER_HOST:-$(detect_ip)}"
  ADMIN_EMAIL="${ADMIN_EMAIL:-admin@sxbvpn.com}"
  ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
  JWT_SECRET="${JWT_SECRET:-$(gen_secret)}"
  ENCRYPTION_KEY="${ENCRYPTION_KEY:-$(gen_key32)}"
  REDIS_PASSWORD="${REDIS_PASSWORD:-$(gen_pass)}"
  POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(gen_pass)}"
  NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-$JWT_SECRET}"

  success "Configuration chargée (host: $SERVER_HOST)"
}

# ── Création du .env ───────────────────────────────────────────────────────────
create_env() {
  info "Création du fichier .env..."

  # Toutes les URLs passent par nginx port 80
  local base_url="http://${SERVER_HOST}"
  local api_url="${base_url}/api"

  cat > "$INSTALL_DIR/.env" << EOF
# ── Généré automatiquement par deploy.sh le $(date) ──

# Serveur
SERVER_HOST=${SERVER_HOST}
NODE_ENV=production

# Backend (interne Docker — nginx est le seul point d'entrée public)
PORT=4000
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

# Admin initial (seed au premier démarrage)
SEED_ADMIN=true
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# Dashboard (URLs publiques via nginx:80)
NEXT_PUBLIC_API_URL=${api_url}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${base_url}

# V2Ray (optionnel — désactivé par défaut)
V2RAY_API_URL=http://127.0.0.1:10085
V2RAY_API_ENABLED=false
TRAFFIC_SYNC_INTERVAL_MS=60000
EOF
  chmod 600 "$INSTALL_DIR/.env"
  success ".env créé"

  # Variables exportées pour le résumé final
  API_URL="$api_url"
  DASHBOARD_URL="$base_url"
}

# ── Firewall ───────────────────────────────────────────────────────────────────
setup_firewall() {
  if command -v ufw &>/dev/null; then
    ufw allow 22/tcp  &>/dev/null || true
    ufw allow 80/tcp  &>/dev/null || true
    ufw allow 443/tcp &>/dev/null || true
    ufw --force enable &>/dev/null || true
    success "Firewall UFW configuré (22, 80, 443)"
  elif command -v firewall-cmd &>/dev/null; then
    firewall-cmd --permanent --add-service=http  &>/dev/null || true
    firewall-cmd --permanent --add-service=https &>/dev/null || true
    firewall-cmd --permanent --add-service=ssh   &>/dev/null || true
    firewall-cmd --reload &>/dev/null || true
    success "Firewall firewalld configuré"
  fi
}

# ── Arrêt propre de l'ancienne stack ──────────────────────────────────────────
stop_existing() {
  cd "$INSTALL_DIR"
  if $COMPOSE_CMD ps --quiet 2>/dev/null | grep -q .; then
    info "Arrêt des services existants..."
    $COMPOSE_CMD down --remove-orphans 2>/dev/null || true
    success "Services arrêtés"
  fi
}

# ── Build des images ───────────────────────────────────────────────────────────
build_images() {
  cd "$INSTALL_DIR"
  info "Construction des images Docker (cela peut prendre 3-5 minutes)..."
  if ! $COMPOSE_CMD build --no-cache --parallel 2>&1; then
    error "Échec du build Docker. Lancez: cd $INSTALL_DIR && $COMPOSE_CMD build pour voir les détails."
  fi
  success "Images construites avec succès"
}

# ── Démarrage ordonné avec attente healthcheck ─────────────────────────────────
deploy() {
  cd "$INSTALL_DIR"

  step "Démarrage de PostgreSQL et Redis..."
  $COMPOSE_CMD up -d postgres redis

  info "Attente que PostgreSQL soit prêt..."
  local attempt=0
  until $COMPOSE_CMD exec -T postgres pg_isready -U sxbvpn &>/dev/null || [ $attempt -ge 30 ]; do
    echo -n "."; sleep 2; attempt=$((attempt+1))
  done
  echo ""
  [ $attempt -lt 30 ] && success "PostgreSQL prêt" || warn "PostgreSQL lent — on continue quand même"

  step "Démarrage du backend..."
  $COMPOSE_CMD up -d backend

  info "Attente que le backend soit opérationnel (migration Prisma incluse)..."
  attempt=0
  until curl -fsS http://localhost:80/api/healthz &>/dev/null || \
        curl -fsS http://localhost:4000/api/healthz &>/dev/null || \
        [ $attempt -ge 60 ]; do
    echo -n "."; sleep 3; attempt=$((attempt+1))
  done
  echo ""

  step "Démarrage du dashboard et de Nginx..."
  $COMPOSE_CMD up -d dashboard nginx

  success "Tous les services démarrés"
}

# ── Vérification finale de santé ───────────────────────────────────────────────
healthcheck() {
  step "Vérification de santé..."
  sleep 5

  local ok=true

  # Backend via nginx
  if curl -fsS --max-time 10 "http://localhost/api/healthz" &>/dev/null; then
    success "Backend  ✓  http://localhost/api/healthz"
  else
    warn "Backend pas encore accessible via nginx"
    ok=false
  fi

  # Dashboard via nginx
  if curl -fsS --max-time 10 "http://localhost/" &>/dev/null; then
    success "Dashboard ✓  http://localhost/"
  else
    warn "Dashboard pas encore accessible — peut nécessiter 1-2 min supplémentaires"
    ok=false
  fi

  echo ""
  info "État des conteneurs:"
  $COMPOSE_CMD ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || \
  $COMPOSE_CMD ps

  $ok && success "Stack en bonne santé !" || warn "Certains services démarrent encore. Vérifiez dans 2 min."
}

# ── Résumé final ───────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${GREEN}   ✅  SxB VPN déployé avec succès !${NC}"
  echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${BOLD}URLs (tout passe par Nginx port 80):${NC}"
  echo -e "  • Dashboard       : ${BLUE}${DASHBOARD_URL}${NC}"
  echo -e "  • API Backend     : ${BLUE}${API_URL}${NC}"
  echo -e "  • Health Check    : ${BLUE}${API_URL%/api}/api/healthz${NC}"
  echo ""
  echo -e "  ${BOLD}Identifiants admin:${NC}"
  echo -e "  • Email           : ${YELLOW}${ADMIN_EMAIL}${NC}"
  echo -e "  • Mot de passe    : ${YELLOW}${ADMIN_PASSWORD}${NC}"
  echo ""
  echo -e "  ${BOLD}Commandes utiles:${NC}"
  echo -e "  • Logs en direct  : cd ${INSTALL_DIR} && $COMPOSE_CMD logs -f"
  echo -e "  • Logs backend    : cd ${INSTALL_DIR} && $COMPOSE_CMD logs -f backend"
  echo -e "  • État services   : cd ${INSTALL_DIR} && $COMPOSE_CMD ps"
  echo -e "  • Mettre à jour   : sudo bash <(curl -fsSL https://raw.githubusercontent.com/AbakoDolla/stuff-the-vpn/main/deploy.sh)"
  echo -e "  • Redémarrer      : cd ${INSTALL_DIR} && $COMPOSE_CMD restart"
  echo -e "  • Arrêter         : cd ${INSTALL_DIR} && $COMPOSE_CMD down"
  echo ""
  echo -e "  ${BOLD}Variable GitHub Actions pour le build APK:${NC}"
  echo -e "  • BACKEND_URL     = ${BLUE}${API_URL}${NC}"
  echo -e "  • NEXT_PUBLIC_API_URL = ${BLUE}${API_URL}${NC}"
  echo ""
  echo -e "  ${BOLD}Fichier config:${NC} ${INSTALL_DIR}/.env"
  echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════${NC}"
}

# ── Point d'entrée ─────────────────────────────────────────────────────────────
main() {
  [ "$EUID" -ne 0 ] && error "Ce script doit être exécuté en tant que root (sudo bash deploy.sh)"

  print_banner
  detect_os
  install_deps
  install_docker
  ensure_compose

  setup_repo

  # Mode : première installation ou mise à jour ?
  if [ -f "$INSTALL_DIR/.env" ]; then
    echo ""
    echo -e "${YELLOW}Une installation existante a été détectée.${NC}"
    read -rp "$(echo -e "${YELLOW}Mode:${NC} [M]ise à jour (garder config) ou [R]éinstaller ? [M/r]: ")" MODE
    MODE="${MODE:-M}"
    if [[ "$MODE" =~ ^[Rr]$ ]]; then
      stop_existing
      configure_fresh
    else
      stop_existing
      load_existing_config
    fi
  else
    configure_fresh
  fi

  create_env
  setup_firewall
  build_images
  deploy
  healthcheck
  print_summary
}

main "$@"
