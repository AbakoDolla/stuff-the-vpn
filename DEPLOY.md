# 🚀 Guide de Déploiement VPS — Stuff The VPN

## Prérequis

| Outil | Version minimale |
|-------|-----------------|
| VPS Linux | Ubuntu 22.04 LTS |
| Docker | 24+ |
| Docker Compose | v2+ |
| Git | 2+ |
| Domaine DNS | Requis pour SSL |

---

## 1. Cloner le repo

```bash
git clone https://github.com/AbakoDolla/stuff-the-vpn.git /opt/sxbvpn
cd /opt/sxbvpn
```

---

## 2. Configurer l'environnement

```bash
cp .env.example .env
nano .env
```

**Variables critiques à modifier :**

```env
# Base de données
POSTGRES_PASSWORD=<mot_de_passe_fort>
DATABASE_URL=postgresql://sxbvpn:<mot_de_passe_fort>@postgres:5432/sxbvpn

# JWT (minimum 32 caractères aléatoires)
JWT_SECRET=$(openssl rand -base64 48)

# Chiffrement VPN (exactement 32 caractères)
ENCRYPTION_KEY=$(openssl rand -base64 24 | head -c 32)

# Domaine
DOMAIN=vpn.votre-domaine.com
CORS_ORIGIN=https://vpn.votre-domaine.com
NEXT_PUBLIC_API_URL=https://vpn.votre-domaine.com/api
NEXTAUTH_URL=https://vpn.votre-domaine.com

# Compte super-admin initial
SEED_ADMIN_EMAIL=admin@votre-domaine.com
SEED_ADMIN_PASSWORD=<mot_de_passe_fort>
```

---

## 3. SSL avec Let's Encrypt

```bash
# Installer certbot
apt-get update && apt-get install -y certbot

# Obtenir le certificat
certbot certonly --standalone -d vpn.votre-domaine.com

# Copier les certificats pour nginx
mkdir -p /opt/sxbvpn/nginx/ssl
cp /etc/letsencrypt/live/vpn.votre-domaine.com/fullchain.pem /opt/sxbvpn/nginx/ssl/
cp /etc/letsencrypt/live/vpn.votre-domaine.com/privkey.pem   /opt/sxbvpn/nginx/ssl/

# Renouvellement automatique
echo "0 12 * * * certbot renew --quiet && docker restart sxbvpn-nginx" | crontab -
```

---

## 4. Ajouter nginx au docker-compose

Ajouter ce bloc au fichier `docker-compose.yml` :

```yaml
  nginx:
    image: nginx:alpine
    container_name: sxbvpn-nginx
    restart: unless-stopped
    depends_on:
      - backend
      - dashboard
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    environment:
      - DOMAIN=${DOMAIN}
```

---

## 5. Démarrer les services

```bash
# Build + démarrage
docker compose up -d --build

# Initialiser la base de données (première fois uniquement)
docker compose exec backend node -e "
const { execSync } = require('child_process');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });
execSync('node dist/scripts/seed.js', { stdio: 'inherit' });
"

# Vérifier les logs
docker compose logs -f backend
docker compose logs -f dashboard
```

---

## 6. Accès initial

| Accès | URL |
|-------|-----|
| Dashboard admin | `https://vpn.votre-domaine.com` |
| API | `https://vpn.votre-domaine.com/api/healthz` |

Login par défaut : `admin@votre-domaine.com` / `SEED_ADMIN_PASSWORD`

> ⚠️ **Changez immédiatement le mot de passe après la première connexion !**

---

## 7. Protocoles VPN à configurer

Depuis le dashboard → **Inbounds → Ajouter** :

| Protocole | Port conseillé | Usage |
|-----------|---------------|-------|
| VLESS + Reality | 443 | Contournement DPI — recommandé |
| VMess + WS + TLS | 8443 | Compatible anciens clients |
| Trojan | 443 | Alternatif VLESS |
| Shadowsocks | 1080 | Léger, mobile |
| WireGuard | 51820 (UDP) | Rapide, faible latence |
| SSH | 22, 443 | Fallback universel |

---

## 8. Maintenance

```bash
# Sauvegarde base de données
docker compose exec postgres pg_dump -U sxbvpn sxbvpn > backup_$(date +%Y%m%d).sql

# Mise à jour du code
git pull origin main
docker compose up -d --build backend dashboard

# Voir les statistiques en direct
docker compose exec backend node -e "
const { execSync } = require('child_process');
const stats = execSync('curl -s http://localhost:4000/api/admin/stats').toString();
console.log(JSON.parse(stats));
"
```

---

## 9. Sécurité post-installation

```bash
# Firewall (UFW)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP → redirect HTTPS
ufw allow 443/tcp   # HTTPS
ufw allow 51820/udp # WireGuard
ufw enable

# Fail2ban
apt-get install -y fail2ban
systemctl enable fail2ban --now
```

---

## Architecture de production

```
Internet
   │
   ├── :80 ──► Nginx (redirect HTTPS)
   └── :443 ─► Nginx (SSL termination)
                  │
                  ├── /api/* ──────► Backend (Express, :4000)
                  │                     │
                  │                     ├── PostgreSQL (:5432)
                  │                     └── Redis (:6379)
                  │
                  └── /* ──────────► Dashboard (Next.js, :3000)
```
