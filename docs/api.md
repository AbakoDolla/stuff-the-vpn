# API Reference — Stuff The VPN

## Base URL

```
Development : http://localhost:3001
Production  : https://api.stuffthevpn.com
```

## Authentification

Toutes les routes protégées nécessitent un header `Authorization: Bearer <token>`.

## Endpoints prévus (Phase 3)

### Auth
| Méthode | Route                    | Description                    |
|---------|--------------------------|--------------------------------|
| POST    | `/api/auth/login`        | Connexion (email + password)   |
| POST    | `/api/auth/logout`       | Déconnexion                    |
| POST    | `/api/auth/refresh`      | Rafraîchir le token JWT        |

### Utilisateurs
| Méthode | Route                    | Description                    |
|---------|--------------------------|--------------------------------|
| GET     | `/api/users`             | Liste des utilisateurs         |
| GET     | `/api/users/:id`         | Détail d'un utilisateur        |
| PATCH   | `/api/users/:id`         | Modifier un utilisateur        |
| DELETE  | `/api/users/:id`         | Suspendre un compte            |

### Vouchers
| Méthode | Route                      | Description                  |
|---------|----------------------------|------------------------------|
| GET     | `/api/vouchers`            | Liste des vouchers           |
| POST    | `/api/vouchers/generate`   | Générer des vouchers en lot  |
| POST    | `/api/vouchers/activate`   | Activer un voucher           |
| DELETE  | `/api/vouchers/:id`        | Révoquer un voucher          |

### Serveurs
| Méthode | Route                    | Description                    |
|---------|--------------------------|--------------------------------|
| GET     | `/api/servers`           | Liste des serveurs VPN         |
| POST    | `/api/servers`           | Ajouter un serveur             |
| PATCH   | `/api/servers/:id`       | Modifier un serveur            |

### Analytics
| Méthode | Route                    | Description                    |
|---------|--------------------------|--------------------------------|
| GET     | `/api/analytics/usage`   | Statistiques de consommation   |
| GET     | `/api/analytics/revenue` | Statistiques de revenus        |

## Format des réponses

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Codes d'erreur

| Code | Signification              |
|------|---------------------------|
| 400  | Requête invalide           |
| 401  | Non authentifié            |
| 403  | Accès refusé               |
| 404  | Ressource introuvable      |
| 422  | Données invalides          |
| 429  | Trop de requêtes           |
| 500  | Erreur serveur interne     |
