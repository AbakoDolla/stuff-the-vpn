<div align="center">
  <h1>🔐 STUFF THE VPN</h1>
  <p><strong>Plateforme SaaS VPN commerciale — Multi-protocole</strong></p>
  <p>
    <img src="https://img.shields.io/badge/status-beta-blue" alt="Status" />
    <img src="https://img.shields.io/badge/backend-0%20TS%20errors-brightgreen" alt="Backend Build" />
    <img src="https://img.shields.io/badge/backend-Node.js%20%7C%20TypeScript-blue" alt="Backend" />
    <img src="https://img.shields.io/badge/frontend-Next.js%2015%20%7C%20TailwindCSS-black" alt="Frontend" />
    <img src="https://img.shields.io/badge/mobile-Flutter-02569B" alt="Mobile" />
    <img src="https://img.shields.io/badge/database-PostgreSQL%20%2B%20Prisma%207-336791" alt="Database" />
  </p>
</div>

---

## 📌 Description

**Stuff The VPN** est une plateforme SaaS VPN commerciale complète, prenant en charge les protocoles **VLESS, VMess, Trojan, Shadowsocks, WireGuard, OpenVPN et SSH**. Elle permet la vente de services VPN via un système de vouchers/licences, avec gestion des quotas, suivi de la consommation en temps réel et un réseau de revendeurs.

---

## ✨ Fonctionnalités implémentées

| Module | Statut | Description |
|--------|--------|-------------|
| 🎟️ Vouchers & Licences | ✅ | Génération, activation, quota par licence |
| 📊 Quotas & Usage | ✅ | Sync trafic V2Ray en temps réel |
| 🔐 Auth JWT | ✅ | Login, refresh, devices, 2FA ready |
| 👥 Utilisateurs | ✅ | CRUD, rôles, statuts, limites appareils |
| 🤝 Revendeurs | ✅ | Réseau multi-niveaux avec commission |
| 🖥️ Inbounds VPN | ✅ | VLESS/Reality, VMess, Trojan, SS, WG, SSH |
| 🔑 Templates VPN | ✅ | Configs chiffrées AES-256, clés auto-générées |
| 📋 Tickets support | ✅ | Système de tickets avec priorités |
| 🔔 Notifications | ✅ | In-app notifications |
| 📈 Statistiques admin | ✅ | Métriques V2Ray live + DB stats |
| 🔍 Audit logs | ✅ | Traçabilité complète des actions |
| 🔑 API Keys | ✅ | Clés API pour intégrations tierces |
| 💳 Paiements | ✅ | Modèle Payment (Mobile Money, etc.) |
| ⚙️ Settings | ✅ | Paramètres dynamiques via BDD |

---

## 🛠️ Stack technique

### Backend (`apps/backend`)
- **Runtime**: Node.js 20 LTS
- **Langage**: TypeScript 5 — **0 erreurs** ✅
- **Framework**: Express 5
- **Base de données**: PostgreSQL 16 + Prisma 7 ORM
- **Auth**: JWT (access + refresh) + bcrypt
- **Config VPN**: Chiffrement AES-256
- **Build**: esbuild → `dist/index.mjs` (2.3 MB, 955ms)

### Dashboard (`apps/dashboard`)
- **Framework**: Next.js 15.0.3
- **Styling**: TailwindCSS + Radix UI
- **État**: TanStack Query + Zustand
- **Charts**: Recharts + ApexCharts

### Application Mobile (`apps/mobile`)
- **Framework**: Flutter (Dart)

### Infrastructure
- Docker Compose (PostgreSQL, Redis, Backend, Dashboard, Nginx)
- Nginx : reverse proxy SSL, rate limiting, WebSocket

---

## 🚀 Démarrage rapide (développement)

```bash
# Cloner
git clone https://github.com/AbakoDolla/stuff-the-vpn.git
cd stuff-the-vpn

# Variables d'env
cp .env.example .env

# Installer les dépendances
npm install

# Générer le client Prisma
cd apps/backend && npx prisma generate

# Démarrer la base de données (Docker)
docker compose up postgres redis -d

# Migrer + seeder
cd apps/backend && npx prisma migrate dev && node -r dotenv/config dist/scripts/seed.js

# Démarrer le backend
npm run dev          # dans apps/backend/

# Démarrer le dashboard
npm run dev          # dans apps/dashboard/
```

---

## 🌐 Déploiement VPS

### Installation rapide

```bash
# Connectez-vous au VPS
ssh ubuntu@141.95.112.93

# Clonez le repository
cd /home/ubuntu
git clone https://github.com/AbakoDolla/stuff-the-vpn.git sxb-vpn

# Exécutez le script d'installation
cd sxb-vpn/scripts
chmod +x install.sh
sudo ./install.sh
```

### Mise à jour

```bash
cd /home/ubuntu/sxb-vpn/scripts
chmod +x deploy.sh
sudo ./deploy.sh
```

### Sauvegarde

```bash
cd /home/ubuntu/sxb-vpn/scripts
chmod +x backup.sh
sudo ./backup.sh
```

### URLs de production

- **Dashboard**: https://vpnsxb.afrihall.com
- **API Backend**: https://vpnsxb.afrihall.com/api
- **X-UI Panel**: http://141.95.112.93:18790/SgYIH3ik8PvAoTL0yr

### Comptes administrateur

| Service | Identifiants |
|---------|---------------|
| Dashboard | admin@sxbvpn.com / AdminSXB2024! |
| X-UI | Mvwe3tDRVh / ch4F8zA5BK |

### Commandes de maintenance

```bash
# Redémarrer le backend
pm2 restart sxb-backend

# Voir les logs
pm2 logs sxb-backend

# Statut des services
systemctl status nginx postgresql x-ui

# Redémarrer X-UI
sudo systemctl restart x-ui
```

→ **Voir [DEPLOY.md](./DEPLOY.md)** pour le guide complet.

---

## 📁 Structure du projet

```
stuff-the-vpn/
├── apps/
│   ├── backend/          # API Express (TypeScript, 0 erreurs TS)
│   │   ├── src/
│   │   │   ├── controllers/   # Route handlers
│   │   │   ├── services/      # Logique métier
│   │   │   ├── middleware/    # Auth, errors, rate-limit
│   │   │   ├── lib/           # Crypto, VPN generators, logger
│   │   │   └── prisma/        # Client Prisma
│   │   ├── prisma/schema.prisma  # Schéma complet (18 modèles)
│   │   └── dist/              # Build esbuild
│   ├── dashboard/         # Next.js 15 admin dashboard
│   └── mobile/            # Flutter mobile app
├── nginx/nginx.conf       # Reverse proxy SSL
├── docker-compose.yml     # Stack complète
├── DEPLOY.md              # Guide déploiement VPS
└── .env.example           # Variables requises
```

---

## 🔌 Protocoles VPN supportés

| Protocole | Implémentation |
|-----------|----------------|
| VLESS + Reality | ✅ Clés X25519 auto-générées |
| VMess + WS + TLS | ✅ UUID auto-généré |
| Trojan / Trojan-Go | ✅ Password auto-généré |
| Shadowsocks (R) | ✅ Password + cipher auto |
| WireGuard | ✅ Clés Curve25519 auto-générées |
| OpenVPN | ✅ Config stockée |
| SSH / SSH-SSL / SSH-Payload / SSH-SlowDNS | ✅ Credentials stockés |

---

## 📜 Schéma base de données (18 modèles)

`User` · `Device` · `Plan` · `License` · `Voucher` · `Inbound` · `VpnTemplate` · `VpnUserProfile` · `VpnTemplateAssignment` · `VpnProfile` · `UsageLog` · `AuditLog` · `Reseller` · `Ticket` · `TicketReply` · `Notification` · `Setting` · `ApiKey` · `Payment`
