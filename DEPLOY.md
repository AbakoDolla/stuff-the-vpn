# Guide de déploiement VPS — Stuff The VPN

Architecture complète : **Backend (VPS)** → **Dashboard (Vercel)** → **App Mobile (APK)**

---

## 1. Prérequis VPS

```bash
# Ubuntu 22.04 LTS recommandé
apt update && apt upgrade -y
apt install -y git curl wget ufw nginx certbot python3-certbot-nginx

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# pnpm
npm i -g pnpm pm2

# Docker + Docker Compose (optionnel — si déploiement containerisé)
curl -fsSL https://get.docker.com | bash
```

---

## 2. Déployer le backend sur VPS

### 2.1 Cloner et configurer

```bash
git clone https://github.com/AbakoDolla/stuff-the-vpn.git /opt/sxbvpn
cd /opt/sxbvpn

# Créer le fichier d'environnement
cp apps/backend/.env.example apps/backend/.env
nano apps/backend/.env
```

### 2.2 Variables d'environnement backend (.env)

```env
# === BASE ===
NODE_ENV=production
PORT=5000

# === BASE DE DONNÉES ===
DATABASE_URL=postgresql://sxbvpn_user:MOT_DE_PASSE@localhost:5432/sxbvpn

# === JWT ===
JWT_SECRET=CHAINE_ALEATOIRE_64_CHARS_MINIMUM
JWT_REFRESH_SECRET=AUTRE_CHAINE_ALEATOIRE_64_CHARS
JWT_EXPIRES_IN=7d

# === REDIS (optionnel mais recommandé pour rate limiting) ===
REDIS_URL=redis://127.0.0.1:6379

# === ADMIN AUTO-SEED (premier démarrage) ===
SEED_ADMIN=true
ADMIN_EMAIL=admin@ton-domaine.com
ADMIN_PASSWORD=MotDePasseAdmin2026!
ADMIN_USERNAME=SxBVPN_Admin

# === WIREGUARD (sync automatique) ===
WG_INTERFACES=wg0
WG_SYNC_INTERVAL_MS=30000

# === CORS (domaine dashboard) ===
CORS_ORIGIN=https://ton-dashboard.vercel.app
```

### 2.3 Installer et builder

```bash
cd /opt/sxbvpn/apps/backend

# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations en production
npx prisma migrate deploy

# Builder le backend
npm run build
```

### 2.4 Lancer avec PM2 (recommandé)

```bash
# Démarrer
pm2 start apps/backend/dist/index.mjs --name sxbvpn-backend \
  --env production \
  --max-restarts 10

# Sauvegarder pour redémarrage auto au boot
pm2 startup
pm2 save

# Vérifier les logs
pm2 logs sxbvpn-backend

# Statut
pm2 status
```

### 2.5 Optionnel : Docker Compose

```bash
cd /opt/sxbvpn
docker compose up -d

# Logs
docker compose logs -f backend
```

---

## 3. Configurer Nginx (reverse proxy + SSL)

```bash
# Créer la config Nginx
cat > /etc/nginx/sites-available/sxbvpn << 'NGINX'
server {
    listen 80;
    server_name api.ton-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
NGINX

ln -s /etc/nginx/sites-available/sxbvpn /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# SSL gratuit avec Let's Encrypt
certbot --nginx -d api.ton-domaine.com --non-interactive --agree-tos -m admin@ton-domaine.com
```

---

## 4. Déployer le Dashboard (Vercel)

### 4.1 Prérequis Vercel
- Compte Vercel : https://vercel.com
- Projet lié au repo GitHub

### 4.2 Variables d'environnement Vercel
Dans Settings → Environment Variables :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.ton-domaine.com/api` |
| `NEXTAUTH_SECRET` | clé aléatoire 32+ chars |
| `NEXTAUTH_URL` | `https://ton-dashboard.vercel.app` |

### 4.3 Configuration Vercel (apps/dashboard/vercel.json)
Déjà configuré dans le repo. Vercel détecte automatiquement Next.js.

### 4.4 Déployer
```bash
# Via GitHub (automatique dès que tu push sur main)
# OU via Vercel CLI :
npx vercel --prod --cwd apps/dashboard
```

---

## 5. Compiler l'APK mobile

### 5.1 Via GitHub Actions (recommandé)

1. Aller dans **Actions** → **Build Flutter APK** → **Run workflow**
2. Renseigner le **Backend URL** : `https://api.ton-domaine.com/api`
3. Télécharger l'APK généré dans les **Artifacts**

### 5.2 En local (Flutter installé)

```bash
cd apps/mobile

flutter pub get

flutter build apk --release \
  --dart-define=BACKEND_URL=https://api.ton-domaine.com/api

# APK disponible dans :
# apps/mobile/build/app/outputs/flutter-apk/app-release.apk
```

---

## 6. Flux de communication Backend ↔ Dashboard ↔ App Mobile

```
┌──────────────────────────────────────────────────────────────────┐
│                        VPS (Ubuntu 22.04)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Nginx (port 80/443)  →  Backend Express (port 5000)   │    │
│  │                                                          │    │
│  │  API Routes :                                            │    │
│  │   /api/auth/*         → authentification                │    │
│  │   /api/mobile/*       → app mobile (token SXB-XXXX)    │    │
│  │   /api/admin/*        → dashboard admin                 │    │
│  │   /api/licenses/*     → gestion licences                │    │
│  │   /api/inbounds/*     → config serveurs VPN             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                    │
│  ┌──────────────┐    ┌──────────────────┐                       │
│  │  PostgreSQL  │    │      Redis        │                       │
│  │  (port 5432) │    │  (rate limiting)  │                       │
│  └──────────────┘    └──────────────────┘                       │
└──────────────────────────────────────────────────────────────────┘
           │                                        │
           ▼                                        ▼
┌─────────────────────┐              ┌────────────────────────┐
│  Dashboard (Vercel)  │              │   App Mobile (Android)  │
│                      │              │                          │
│  NEXT_PUBLIC_API_URL │              │  BACKEND_URL compilé    │
│  = https://api.dom/  │              │  = https://api.dom/api  │
│                      │              │                          │
│  Admin crée licence  │              │  User entre token       │
│  SXB-XXXX-XXXX-XXXX  │──token────▶  │  POST /mobile/activate  │
│                      │              │  ▶ reçoit JWT           │
│                      │              │  GET /mobile/config     │
│                      │              │  ▶ reçoit profils VPN   │
└─────────────────────┘              └────────────────────────┘
```

---

## 7. Flux token Dashboard → App Mobile

```
1. Admin (Dashboard)  →  Crée une licence  →  Token: SXB-A1B2-C3D4-E5F6-G7H8
2. User (App Mobile)  →  Saisit le token
3. App               →  POST /api/mobile/activate  { token, deviceId }
4. Backend           →  Valide + lie l'appareil  →  retourne { accessToken, user, license }
5. App               →  Stocke le JWT (flutter_secure_storage)
6. App               →  GET /api/mobile/config  (Authorization: Bearer JWT)
7. Backend           →  Retourne profils VPN (VLESS/VMESS/WG/SSH/OpenVPN)
8. App               →  Connecte en interne (l'utilisateur ne voit pas la config)
9. App               →  POST /api/mobile/logs  { event: CONNECT, protocol, server }
10. Backend          →  Enregistre le log + met à jour le quota
```

---

## 8. Mise à jour du backend (redéployement)

```bash
cd /opt/sxbvpn
git pull origin main

cd apps/backend
npm install
npx prisma migrate deploy
npm run build

pm2 restart sxbvpn-backend
pm2 logs sxbvpn-backend --lines 30
```

---

## 9. Secrets GitHub Actions (CI/CD automatique)

Dans GitHub → Settings → Secrets and variables → Actions :

| Secret | Description |
|---|---|
| `VPS_HOST` | IP ou domaine du VPS |
| `VPS_USER` | Utilisateur SSH (ex: root) |
| `VPS_KEY` | Clé privée SSH (contenu complet) |
| `VPS_PORT` | Port SSH (défaut: 22) |
| `VERCEL_TOKEN` | Token API Vercel |
| `VERCEL_ORG_ID` | ID organisation Vercel |
| `VERCEL_PROJECT_ID` | ID projet Vercel |

Variables (pas secrets) :

| Variable | Description |
|---|---|
| `DEPLOY_ENABLED` | `true` pour activer le déploiement auto |
| `BACKEND_URL` | URL backend pour l'APK Flutter |
| `NEXT_PUBLIC_API_URL` | URL API pour le dashboard |

---

## 10. Checklist déploiement complet

- [ ] VPS Ubuntu 22.04 commandé (Hetzner / Contabo / OVH)
- [ ] Domaine DNS configuré : `api.ton-domaine.com` → IP VPS
- [ ] PostgreSQL installé et base créée
- [ ] Redis installé (optionnel)
- [ ] `.env` backend rempli (DATABASE_URL, JWT_SECRET, etc.)
- [ ] Backend démarré avec PM2
- [ ] Nginx configuré et SSL actif
- [ ] Dashboard Vercel déployé avec `NEXT_PUBLIC_API_URL`
- [ ] APK compilé avec `BACKEND_URL` correct
- [ ] Admin créé via `SEED_ADMIN=true`
- [ ] Première licence créée depuis le dashboard
- [ ] Token testé dans l'app mobile
