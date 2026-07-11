# Démarrage Rapide - Déploiement APK

## TL;DR - 3 étapes

### 1. Configurer les secrets GitHub (5 min)

Allez sur: https://github.com/AbakoDolla/stuff-the-vpn/settings/secrets/actions

Ajouter 4 secrets:
```
VPS_HOST = votre-adresse-vps
VPS_USERNAME = ubuntu
VPS_SSH_KEY = (copie votre clé SSH private)
VPS_PORT = 22
```

### 2. Déclencher le build

Option A - Manuellement:
```
https://github.com/AbakoDolla/stuff-the-vpn/actions
→ "Build & Download APK" 
→ "Run workflow"
```

Option B - Via push:
```bash
git push origin main
```

### 3. Attendre et télécharger

- Allez sur: https://github.com/AbakoDolla/stuff-the-vpn/actions
- Cliquez sur le build (Build & Download APK)
- Attendez ~5 min (Build APK job)
- Allez dans Artifacts → sxbvpn-release-apk
- Téléchargez: app-release.apk

---

## Problèmes Corrigés ✅

1. **App crash (SXB VPN s'arrête)** → FIXÉ
   - Removed nested MaterialApp instances
   - Simplified widget tree

2. **GitHub build fail (Dart SDK too old)** → FIXÉ
   - Flutter 3.24.0 → 3.44.6
   - google_fonts 8.1.0 now compatible

3. **Permission denied (workflow)** → DOC ADDED
   - Need PAT with `workflow` scope
   - All secrets documented

---

## APK Locations

**GitHub:**
- Artifacts: `sxbvpn-release-apk/app-release.apk`
- Retention: 30 jours

**VPS (if secrets configured):**
- Path: `~/stuff-the-vpn/apps/backend/public/downloads/sxb-vpn.apk`

---

## Besoin d'aide?

Consulter:
- `GITHUB_WORKFLOW_SETUP.md` - Configuration complète des secrets
- `MOBILE_FIX_SUMMARY.md` - Détails du fix app mobile
- `DEPLOYMENT_FIX.md` - Guide déploiement complet

