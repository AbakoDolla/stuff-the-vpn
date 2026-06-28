#!/usr/bin/env bash
# ─── SxBVPN — Setup rapide (CodeSandbox / Linux) ─────────────────────────────
set -e

echo '🚀 SxBVPN - Setup automatique'
echo '================================'

ROOT=$(pwd)

# ── 1. Backend ────────────────────────────────────────────────────────────────
echo ''
echo '📦 [1/4] Installation des dépendances backend...'
cd $ROOT/apps/backend
npm install

# ── 2. Variables d'environnement backend ─────────────────────────────────────
if [ ! -f .env ]; then
  echo ''
  echo '⚙️  [2/4] Création du fichier .env backend...'
  cp .env.example .env
  echo '   ✅ .env créé depuis .env.example'
  echo '   ⚠️  Éditez apps/backend/.env et renseignez DATABASE_URL si besoin'
else
  echo ''
  echo '⚙️  [2/4] .env déjà présent — skip'
fi

# ── 3. Base de données ────────────────────────────────────────────────────────
echo ''
echo '🗄️  [3/4] Création des tables en base de données...'
npm run prisma:push

# ── 4. Seed admin ─────────────────────────────────────────────────────────────
echo ''
echo '👤 [4/4] Création du compte administrateur...'
npm run seed

# ── 5. Dashboard ──────────────────────────────────────────────────────────────
echo ''
echo '🎨 [5/5] Installation des dépendances dashboard...'
cd $ROOT/apps/dashboard
npm install

if [ ! -f .env.local ]; then
  echo 'NEXT_PUBLIC_API_URL=http://localhost:5000/api' > .env.local
  echo '   ✅ .env.local dashboard créé'
fi

echo ''
echo '════════════════════════════════════════'
echo '✅ Setup terminé !'
echo ''
echo '  Lancez le backend :'
echo '    cd apps/backend && npm run dev'
echo ''
echo '  Lancez le dashboard (autre terminal) :'
echo '    cd apps/dashboard && npm run dev'
echo ''
echo '  Identifiants dashboard :'
echo '    Email    : admin@sxbvpn.com'
echo '    Password : SxBvpn2026'
echo '════════════════════════════════════════'
