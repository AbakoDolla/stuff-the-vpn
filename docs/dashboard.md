# Dashboard SxBVPN — Guide d'utilisation

  ## Accès

  | Champ | Valeur par défaut |
  |---|---|
  | URL | http://localhost:3000 |
  | Email | admin@sxbvpn.com |
  | Nom d'utilisateur | SxBVPN |
  | Mot de passe | SxBvpn2026 |

  > ⚠️ **Changez le mot de passe en production** via Paramètres → Sécurité.

  ## Lancer le dashboard en développement

  ```bash
  cd apps/dashboard
  npm install
  NEXT_PUBLIC_API_URL=http://localhost:5000 npm run dev
  ```

  ## Variables d'environnement

  | Variable | Description | Défaut |
  |---|---|---|
  | `NEXT_PUBLIC_API_URL` | URL de l'API backend | `http://localhost:5000` |

  ## Pages disponibles

  | Route | Description |
  |---|---|
  | /login | Page de connexion admin |
  | /dashboard | Vue d'ensemble (stats, trafic, alertes) |
  | /users | Gestion des utilisateurs (CRUD) |
  | /vouchers | Génération et gestion des vouchers |
  | /servers | Serveurs et inbounds VPN |
  | /analytics | Graphiques et analytiques |
  | /resellers | Gestion des revendeurs |
  | /settings | Configuration, sécurité, notifications |

  ## Synchronisation avec l'App Mobile

  Le dashboard et l'app mobile partagent **le même backend API** (`apps/backend`).

  - Tout utilisateur créé depuis le dashboard est immédiatement disponible sur l'app.
  - Les vouchers générés peuvent être utilisés directement dans l'app via le flow de rachat.
  - Les statistiques d'usage sont en temps réel depuis la même base de données.

  ## Seed automatique du compte admin

  Au démarrage, si `SEED_ADMIN=true` est défini dans les variables d'environnement du backend, le compte admin sera créé automatiquement :

  ```env
  SEED_ADMIN=true
  ADMIN_USERNAME=SxBVPN
  ADMIN_EMAIL=admin@sxbvpn.com
  ADMIN_PASSWORD=SxBvpn2026
  ```
  