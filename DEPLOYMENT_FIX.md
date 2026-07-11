# SxB VPN - Correctif de Déploiement

## Problèmes Corrigés

### 1. **Doublon de route APK** ❌
- **Problème** : Route `/api/apk/download` définie deux fois dans `index.ts` et `app.ts`
- **Effet** : Crash de l'application au démarrage
- **Solution** : Suppression du doublon dans `index.ts`, conservation du code robuste dans `app.ts`

### 2. **Chemin APK hardcodé incorrect** ❌
- **Problème** : Chemin `/home/ubuntu/sxbvpn-debug.apk` qui n'existe pas en production
- **Effet** : Erreur 500 lors du téléchargement de l'APK
- **Solution** : Utilisation du chemin relatif correct `public/downloads/sxb-vpn.apk`

### 3. **Gestion d'erreurs insuffisante** ❌
- **Problème** : En cas d'erreur lors du téléchargement, les headers HTTP pouvaient être envoyés deux fois
- **Effet** : Crash du serveur avec "headers already sent"
- **Solution** : Ajout de vérifications et try-catch appropriées

### 4. **Configuration CORS problématique** ❌
- **Problème** : CORS non flexible pour les origines multiples
- **Effet** : Erreurs de CORS pour les clients mobiles ou depuis différents domaines
- **Solution** : Support des origines multiples séparées par virgules en production

### 5. **Validation d'environnement faible** ❌
- **Problème** : Pas de validation robuste des variables d'environnement critiques
- **Effet** : Crash difficile à déboguer en production
- **Solution** : Validation explicite de `DATABASE_URL` et autres variables critiques

## Fichiers Modifiés

1. **`/apps/backend/src/index.ts`**
   - ✅ Suppression du doublon de route APK
   - ✅ Amélioration de la validation des variables d'environnement
   - ✅ Meilleur logging des erreurs

2. **`/apps/backend/src/app.ts`**
   - ✅ Amélioration de la gestion d'erreurs pour la route APK
   - ✅ Support CORS flexible pour origines multiples
   - ✅ Ajout de maxAge pour les réponses CORS

3. **`/apps/backend/.env.production.example`** (nouveau)
   - ✅ Configuration de production correcte
   - ✅ Documentation des variables critiques

## Comment Déployer

### Sur Vercel

1. **Définirez les variables d'environnement** dans les settings du projet Vercel :
   ```
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   JWT_SECRET=your_strong_secret_here (min 32 chars)
   ENCRYPTION_KEY=your_strong_key_here (min 32 chars)
   SERVER_SECRET=your_strong_secret_here (min 32 chars)
   CORS_ORIGIN=https://your-dashboard.vercel.app
   NODE_ENV=production
   PORT=3000
   ```

2. **Redéployez votre application** :
   - Allez sur Vercel Dashboard
   - Sélectionnez votre projet
   - Cliquez sur "Redeploy" ou poussez un nouveau commit

3. **Vérifiez la santé du serveur** :
   ```bash
   curl https://your-backend.vercel.app/api/healthz
   # Devrait retourner: {"status":"ok","timestamp":"..."}
   ```

### En Local (Test avant déploiement)

```bash
cd apps/backend

# Installez les dépendances
npm install

# Configurez l'environnement
cp .env.example .env.local

# Générez Prisma Client
npm run prisma:generate

# Lancez le serveur
npm run dev
```

## Variables d'Environnement Critiques

| Variable | Obligatoire | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | ❌ | `redis://host:6379` |
| `JWT_SECRET` | ✅ | Min 32 caractères |
| `ENCRYPTION_KEY` | ✅ | Min 32 caractères |
| `SERVER_SECRET` | ✅ | Min 32 caractères |
| `CORS_ORIGIN` | ✅ | `https://app.example.com` |
| `NODE_ENV` | ✅ | `production` |

## Tests Recommandés

```bash
# Test des routes principales
curl -X GET https://your-backend.vercel.app/api/healthz

# Test du téléchargement APK (après déploiement)
curl -L -o test.apk https://your-backend.vercel.app/api/apk/download
file test.apk  # Vérifiez que c'est bien un fichier APK

# Test de la connexion de base de données
# Attendez 30s après le déploiement pour que Prisma se connecte
curl -X POST https://your-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sxbvpn.com","password":"SxBvpn2026"}'
```

## Logs de Diagnostic

Pour voir les logs en temps réel sur Vercel :
1. Allez sur Vercel Dashboard
2. Sélectionnez votre projet
3. Cliquez sur "Logs"
4. Filtrez par "runtime" pour voir les erreurs du serveur

## Support

Si vous rencontrez toujours des problèmes :
1. Vérifiez que **TOUS** les fichiers `.env` ne contiennent pas de variables vides
2. Vérifiez que la base de données PostgreSQL est accessible depuis Vercel
3. Vérifiez que l'APK existe bien dans `public/downloads/sxb-vpn.apk`
4. Consultez les logs Vercel pour les erreurs spécifiques
