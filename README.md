<div align="center">
  <h1>🔐 STUFF THE VPN</h1>
  <p><strong>Plateforme SaaS VPN commerciale — V2Ray & SSH</strong></p>
  <p>
    <img src="https://img.shields.io/badge/status-in%20development-yellow" alt="Status" />
    <img src="https://img.shields.io/badge/license-proprietary-red" alt="License" />
    <img src="https://img.shields.io/badge/backend-Node.js%20%7C%20TypeScript-blue" alt="Backend" />
    <img src="https://img.shields.io/badge/frontend-Next.js%20%7C%20TailwindCSS-black" alt="Frontend" />
    <img src="https://img.shields.io/badge/mobile-Flutter-02569B" alt="Mobile" />
  </p>
</div>

---

## 📌 Description

**Stuff The VPN** est une plateforme SaaS VPN commerciale complète, prenant en charge les protocoles **V2Ray** et **SSH**. Elle permet la vente de services VPN via un système de vouchers, avec gestion des quotas, suivi de la consommation et un réseau de revendeurs.

---

## ✨ Fonctionnalités prévues

| Fonctionnalité | Description |
|---|---|
| 🎟️ Système de vouchers | Génération, activation et gestion des codes d'accès |
| 📊 Gestion des quotas | Limitation de la bande passante et de la durée |
| 📈 Suivi de consommation | Monitoring en temps réel de l'utilisation par utilisateur |
| 🤝 Système de revendeurs | Réseau de distribution avec tableaux de bord dédiés |
| 🖥️ Dashboard d'administration | Interface centralisée de gestion complète |
| 🔐 Distribution sécurisée | Génération et distribution chiffrée des configurations V2Ray/SSH |

---

## 🛠️ Stack technique

### Backend
- **Runtime**: Node.js LTS
- **Langage**: TypeScript
- **Framework**: Express
- **Base de données**: PostgreSQL + Prisma ORM
- **Auth**: JWT + sessions

### Dashboard (Web Admin)
- **Framework**: Next.js 14
- **Styling**: TailwindCSS
- **Langage**: TypeScript

### Application Mobile
- **Framework**: Flutter
- **Langage**: Dart

### Infrastructure
- **Containerisation**: Docker + Docker Compose
- **Protocoles VPN**: V2Ray, SSH

---

## 🗺️ Roadmap

### ✅ Phase 1 — Architecture du projet
> Structure du monorepo, configuration des outils, scaffolding des modules.

### 🔲 Phase 2 — Base de données
> Définition des modèles Prisma, migrations, seeders.

### 🔲 Phase 3 — API Backend
> Implémentation des endpoints REST : auth, utilisateurs, vouchers, quotas, revendeurs.

### 🔲 Phase 4 — Dashboard
> Interface d'administration complète avec Next.js et TailwindCSS.

### 🔲 Phase 5 — Application Flutter
> Application mobile pour les utilisateurs finaux (iOS & Android).

### 🔲 Phase 6 — Intégration V2Ray & SSH
> Génération automatique des configurations, distribution sécurisée.

### 🔲 Phase 7 — Monitoring, quotas & sécurité
> Système de monitoring, alertes, gestion avancée des quotas, audit de sécurité.

---

## 📁 Structure du projet

```
stuff-the-vpn/
├── apps/
│   ├── backend/          # API REST (Node.js + Express + TypeScript)
│   ├── dashboard/        # Interface admin (Next.js + TailwindCSS)
│   └── mobile/           # Application mobile (Flutter)
├── packages/
│   ├── ui/               # Composants UI réutilisables
│   ├── types/            # Types TypeScript partagés
│   └── shared/           # Constantes et utilitaires communs
├── prisma/               # Schéma de base de données
├── docker/               # Dockerfiles et docker-compose
├── docs/                 # Documentation technique
└── .github/              # CI/CD workflows
```

---

## 🚀 Démarrage rapide

```bash
# Cloner le dépôt
git clone https://github.com/AbakoDolla/stuff-the-vpn.git
cd stuff-the-vpn

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Démarrer en développement
docker-compose up -d
```

---

## 📄 Licence

Propriétaire — © 2025 Stuff The VPN. Tous droits réservés.
