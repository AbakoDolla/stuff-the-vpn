# Déploiement — Stuff The VPN

## Environnements

| Environnement | URL                          | Description                        |
|---------------|------------------------------|------------------------------------|
| Development   | localhost                    | Développement local via Docker      |
| Staging       | staging.stuffthevpn.com      | Tests d'intégration                 |
| Production    | stuffthevpn.com              | Environnement de production         |

## Prérequis

- Docker & Docker Compose
- Node.js 20 LTS
- PostgreSQL 16
- Redis 7

## Démarrage local

```bash
# Cloner le projet
git clone https://github.com/AbakoDolla/stuff-the-vpn.git
cd stuff-the-vpn

# Démarrer les services
docker-compose -f docker/docker-compose.yml up -d

# Initialiser la base de données
cd apps/backend
npx prisma migrate dev
npx prisma db seed

# L'API est disponible sur http://localhost:3001
# Le dashboard sur http://localhost:3000
```

## Variables d'environnement requises

Copier `apps/backend/.env.example` vers `apps/backend/.env` et remplir les valeurs.

## CI/CD (Phase 7)

- GitHub Actions pour les tests et le build
- Déploiement automatique sur la branche `main`
- Rollback automatique en cas d'échec des health checks
