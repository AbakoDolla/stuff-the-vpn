# Guide d'installation VPS — SxB VPN Backend

## Prérequis VPS
- Ubuntu 22.04 / Debian 12 (recommandé)
- 1 vCPU, 1 GB RAM minimum (2 GB recommandé)
- Port 80 et 443 ouverts dans le firewall

## Étape 1 — Installer Docker sur le VPS

```bash
# Connexion SSH
ssh root@VOTRE_IP_VPS

# Installer Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Vérifier
docker --version
```

## Étape 2 — Cloner le repo

```bash
git clone https://github.com/AbakoDolla/stuff-the-vpn.git
cd stuff-the-vpn
```

## Étape 3 — Configurer les variables

```bash
cp .env.production.example .env
nano .env
```

Remplissez :
- `POSTGRES_PASSWORD` — un mot de passe fort (ex: `openssl rand -base64 24`)
- `JWT_SECRET` — une clé secrète (ex: `openssl rand -base64 48`)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — vos identifiants admin
- `CORS_ORIGIN` — l'URL de votre dashboard Vercel (ex: `https://sxbvpn.vercel.app`)

## Étape 4 — Déployer

```bash
chmod +x deploy.sh
./deploy.sh
```

## Étape 5 — Configurer le dashboard sur Vercel

Dans Vercel → Settings → Environment Variables, ajoutez :
```
NEXT_PUBLIC_API_URL = http://VOTRE_IP_VPS
```

## Commandes utiles

```bash
# Voir les logs en temps réel
docker compose logs -f backend

# Redémarrer après une mise à jour
./deploy.sh

# Status des services
docker compose ps

# Arrêter tout
docker compose down

# Base de données (accès direct)
docker compose exec db psql -U stv_user sxbvpn
```

## SSL avec Let's Encrypt (optionnel)

```bash
apt install certbot
certbot certonly --standalone -d votre-domaine.com

# Puis décommentez la section HTTPS dans docker/nginx.conf
```
