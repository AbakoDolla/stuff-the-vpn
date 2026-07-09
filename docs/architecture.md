# Architecture — Stuff The VPN

## Vue d'ensemble

Stuff The VPN est une plateforme SaaS VPN organisée en monorepo, composée de trois applications principales communiquant via une API REST centralisée.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│          Mobile App (Flutter)    Dashboard (Next.js)        │
└──────────────────┬──────────────────────┬───────────────────┘
                   │                      │
                   ▼                      ▼
         ┌─────────────────────────────────────┐
         │          API REST (Express)          │
         │         apps/backend                │
         └──────┬────────────┬─────────────────┘
                │            │
         ┌──────▼──┐   ┌─────▼──────┐
         │PostgreSQL│   │   Redis    │
         │  (data) │   │  (cache)   │
         └─────────┘   └────────────┘
```

## Modules backend

| Module      | Rôle                                                    |
|-------------|----------------------------------------------------------|
| `auth`      | Authentification JWT, sessions, refresh tokens          |
| `users`     | Gestion des comptes utilisateurs                        |
| `resellers` | Réseau de revendeurs, commissions                        |
| `vouchers`  | Génération, activation, expiration des codes            |
| `quotas`    | Application et suivi des quotas de bande passante       |
| `devices`   | Enregistrement des appareils, limite par compte         |
| `servers`   | Gestion des serveurs VPN (V2Ray, SSH)                   |
| `configs`   | Génération et distribution des configurations VPN       |
| `logs`      | Journalisation système et utilisateur                   |
| `analytics` | Statistiques et rapports                                |

## Flux d'activation d'un voucher

```
Utilisateur saisit le code
        │
        ▼
API: POST /api/vouchers/activate
        │
        ├─ Valide le code (format, existence, statut)
        ├─ Vérifie si l'utilisateur peut l'activer
        ├─ Attribue le quota (bandwidth, durée, devices)
        ├─ Génère la configuration V2Ray/SSH
        └─ Retourne la config chiffrée à l'app
```

## TODO (Phase 1→2)

- [ ] Finaliser le schéma Prisma
- [ ] Définir les contrats d'API (OpenAPI)
- [ ] Documenter les flux d'authentification
