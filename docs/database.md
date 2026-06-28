# Base de données — Stuff The VPN

## SGBD

**PostgreSQL 16** avec **Prisma ORM**.

## Entités prévues

| Table          | Description                                              |
|----------------|-----------------------------------------------------------|
| `users`        | Comptes utilisateurs (clients et revendeurs)             |
| `resellers`    | Profils des revendeurs avec taux de commission           |
| `vouchers`     | Codes d'accès VPN avec configuration de quota            |
| `devices`      | Appareils enregistrés par les utilisateurs               |
| `servers`      | Serveurs VPN disponibles (V2Ray, SSH)                    |
| `usage`        | Suivi de consommation de bande passante                  |
| `logs`         | Journal d'événements système                             |
| `subscriptions`| Abonnements et historique de paiement                    |

## Schéma (à définir — Phase 2)

> Le schéma Prisma sera défini dans `prisma/schema.prisma` lors de la Phase 2.

## Conventions

- Toutes les tables ont `id` (UUID), `created_at`, `updated_at`
- Les suppressions sont logiques (soft delete via `deleted_at`)
- Les données sensibles (configs VPN) sont chiffrées au repos

## Migrations

```bash
# Appliquer les migrations en développement
npx prisma migrate dev

# Appliquer en production
npx prisma migrate deploy
```
