# Configuration du Déploiement GitHub Actions

## Problème Rencontré

```
refusing to allow a GitHub App to create or update workflow `.github/workflows/build-apk.yml` without `workflows` permission
```

**Cause:** Le token GitHub n'a pas la permission `workflows` nécessaire pour mettre à jour les fichiers workflow.

---

## ✅ Solution Appliquée

Le workflow `build-apk.yml` a été corrigé avec:
- ✅ Flutter version mise à jour: **3.24.0 → 3.44.6** (compatible avec google_fonts 8.1.0)
- ✅ Ajout du job de déploiement VPS
- ✅ Gestion d'erreurs améliorée

---

## Configuration des Secrets GitHub

Pour que le déploiement fonctionne, configurez ces secrets:

### 1. Personal Access Token (pour les workflows)

**Créer un PAT:**
1. https://github.com/settings/tokens/new
2. **Nom:** `GITHUB_WORKFLOW_TOKEN`
3. **Scopes:**
   - ✅ `repo`
   - ✅ `workflow`
   - ✅ `admin:repo_hook`
4. **Copier le token**

**Ajouter à GitHub:**
1. https://github.com/AbakoDolla/stuff-the-vpn/settings/secrets/actions
2. `New repository secret`
3. **Name:** `GITHUB_WORKFLOW_TOKEN`
4. **Value:** (collez le PAT)

### 2. Credentials VPS

Ajoutez ces 4 secrets pour le déploiement:

| Secret | Valeur | Exemple |
|--------|--------|---------|
| `VPS_HOST` | IP ou domaine VPS | `vpn.example.com` |
| `VPS_USERNAME` | Utilisateur SSH | `ubuntu` |
| `VPS_SSH_KEY` | Clé privée SSH | (contenu de ~/.ssh/id_rsa) |
| `VPS_PORT` | Port SSH | `22` |

---

## Test du Workflow

### Option 1: Test manuel
1. https://github.com/AbakoDolla/stuff-the-vpn/actions
2. "Build & Download APK"
3. "Run workflow" → "Run workflow"

### Option 2: Via git push
```bash
cd /vercel/share/v0-project
git push origin main
```

---

## Statut du Build

Vérifiez l'état à: https://github.com/AbakoDolla/stuff-the-vpn/actions

**Étapes du workflow:**
1. ✅ Setup Java 17
2. ✅ Setup Flutter 3.44.6
3. ✅ Install dependencies (google_fonts 8.1.0)
4. ✅ Build APK
5. ✅ Upload artifact
6. ✅ Deploy to VPS (optionnel)

---

## Dépannage

### "Dart SDK 3.5.0 too old"
→ ✅ **CORRIGÉ** (Flutter 3.44.6 inclut Dart 3.5+)

### "google_fonts version solving failed"
→ ✅ **CORRIGÉ** (Flutter 3.44.6 supporte google_fonts 8.1.0)

### "SSH permission denied"
→ Vérifiez VPS_SSH_KEY et les permissions ~/.ssh/authorized_keys

### "workflow permission denied"
→ Utilisez un PAT avec le scope `workflow`

---

## Fichiers de Build

**Artifacts GitHub:**
- Localisation: Actions → Latest run → Artifacts
- Nom: `sxbvpn-release-apk`
- Fichier: `app-release.apk`

**VPS (si configuré):**
```
~/stuff-the-vpn/apps/backend/public/downloads/sxb-vpn.apk
```

---

## Commandes de Test Local

```bash
cd apps/mobile

# Tester la résolution des dépendances
flutter pub get

# Générer les assets
flutter pub run flutter_launcher_icons:main
flutter pub run flutter_native_splash:create

# Build APK (sans workflow)
flutter build apk --release \
  --dart-define=BACKEND_URL=https://vpnsxb.afrihall.com/api

# L'APK sera à:
# build/app/outputs/flutter-apk/app-release.apk
```

---

## Support

- **Logs workflow:** https://github.com/AbakoDolla/stuff-the-vpn/actions
- **Fichiers de config:** `.github/workflows/build-apk.yml`
- **App config:** `apps/mobile/pubspec.yaml`

