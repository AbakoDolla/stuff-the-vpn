# SXB VPN — Monorepo

Dépôt réel : `AbakoDolla/stuff-the-vpn` (GitHub public).

## Structure

```
apps/
  backend/      — API Express 5 + Prisma + Redis  (port 4000, PM2 sur VPS)
  dashboard/    — Next.js admin dashboard          (port 3001, PM2 sur VPS)
  mobile/       — Flutter app Android (sst_vpn)   ← cible principale
packages/       — bibliothèques partagées (types, ui, shared)
lib/            — api-zod, db helpers
mobile/         — ancienne app Flutter à la racine (non maintenu, ne pas toucher)
docker/         — docker-compose pour déploiement complet
docs/           — api.md, architecture.md, database.md, deployment.md, security.md
```

## Environnement de production

- Backend API : `https://vpnsxb.afrihall.com/api`
- Dashboard : `https://vpnsxb.afrihall.com`
- VPS : Ubuntu, PM2 (`sxbvpn-backend` port 4000, `sxbvpn-dashboard` port 3001)
- Nginx : reverse proxy avec TLS Let's Encrypt

## App mobile (apps/mobile)

Flutter 3.24 — Riverpod + GoRouter + Dio + flutter_secure_storage

**Flux principal :** Splash → Activation (Device ID + Token) → 5 onglets  
**Auth :** activation par token cryptographique uniquement (POST `/api/mobile/device/activate`)  
**APK :** buildé par GitHub Actions (`.github/workflows/build-apk.yml`)

## Développement

Pas de preview Flutter disponible dans Replit. Modifications → commit → push → GitHub Actions build APK.

Pour modifier la couche API mobile : `apps/backend/src/controllers/mobile.controller.ts`  
Pour modifier les écrans Flutter : `apps/mobile/lib/features/`

## Accès VPS (secrets Replit)

`VPS_SSH_HOST`, `VPS_SSH_USER`, `VPS_SSH_PASSWORD` — connexion via `sshpass -e ssh ...`  
Note : trimmer les espaces du username (`xargs`) avant usage.

## User preferences

- Langue par défaut de l'interface : Français
- Zéro donnée simulée/mockée nulle part
- Ne jamais afficher aux utilisateurs : protocoles VPN, UUID, ports, clés, serveurs, pays
- L'app doit visuellement correspondre au Dashboard (même identité de marque)
