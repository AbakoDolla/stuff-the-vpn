# SXB VPN — Spécification Complète

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Schéma Base de Données](#schéma-base-de-données)
4. [API Backend](#api-backend)
5. [Dashboard Administrateur](#dashboard-administrateur)
6. [Sécurité](#sécurité)
7. [Flux d'Activation](#flux-dactivation)
8. [Gestion des Quotas](#gestion-des-quotas)

---

## Vue d'ensemble

**SXB VPN** est une plateforme VPN professionnelle permettant la gestion centralisée d'utilisateurs, appareils, configurations VPN et quotas de données.

### Objectifs
- Plateforme SaaS VPN commerciale
- Activation sécurisée par token cryptographique
- Gestion des quotas en temps réel
- Dashboard d'administration complet
- Aucune sélection de serveur/pays pour l'utilisateur final

---

## Architecture

```
┌─────────────────┐     HTTPS      ┌─────────────────┐
│   Dashboard      │ ──────────────▶│    Backend      │
│   (Admin)        │◀────────────── │    (API)        │
└─────────────────┘                └────────┬────────┘
                                            │
                                            │ HTTPS
                                            ▼
                                   ┌─────────────────┐
                                   │  Application    │
                                   │  Mobile (VPN)   │
                                   └─────────────────┘
```

### Principes
1. **Backend** = cœur du système (唯一 intermédiaire)
2. **Dashboard** communique uniquement avec le Backend
3. **Application** communique uniquement avec le Backend
4. Aucune communication directe Dashboard ↔ Application

---

## Schéma Base de Données

### Modèles Principaux

```prisma
// ══════════════════════════════════════════════════════════════
// ENUMS
// ══════════════════════════════════════════════════════════════

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
  EXPIRED
}

enum DeviceStatus {
  ACTIVE
  DISABLED
  BLOCKED
  PENDING
}

enum TokenStatus {
  ACTIVE
  USED
  EXPIRED
  REVOKED
}

enum ActivationStatus {
  PENDING
  ACTIVATED
  SUSPENDED
  REVOKED
}

enum QuotaPolicy {
  SUSPEND
  THROTTLE
  NOTIFY
}

// ══════════════════════════════════════════════════════════════
// MODELS
// ══════════════════════════════════════════════════════════════

model Admin {
  id           String    @id @default(uuid())
  email        String    @unique
  password     String
  name         String?
  role         String    @default("ADMIN")
  isActive     Boolean   @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  activationTokens ActivationToken[]
  vpnProfiles      VpnProfile[]
  auditLogs       AuditLog[]
}

model User {
  id               String      @id @default(uuid())
  email            String?     @unique
  phone            String?     @unique
  name             String?
  status           UserStatus  @default(ACTIVE)
  deviceLimit      Int         @default(3)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  deletedAt        DateTime?

  devices     Device[]
  quotas      Quota[]
  profiles    VpnUserProfile[]
  activations Activation[]
}

model Device {
  id              String       @id @default(uuid())
  deviceId        String       @unique  // Identifiant unique appareil
  deviceName      String?
  brand           String?      // Samsung, Xiaomi, etc.
  model           String?      // SM-G998B, etc.
  osVersion       String?      // Android 14, etc.
  appVersion      String?
  androidId       String?
  fingerprint     String?
  publicIp        String?
  country         String?
  status          DeviceStatus @default(PENDING)
  firstActivatedAt DateTime?
  lastSyncAt      DateTime?
  connectionCount Int          @default(0)
  isCompromised   Boolean      @default(false)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  userId   String
  user     User     @relation(fields: [userId], references: [id])
  activations Activation[]
  profiles VpnUserProfile[]
  syncLogs  SyncLog[]
}

model ActivationToken {
  id           String      @id @default(uuid())
  token        String      @unique
  deviceId     String      // Pour quel appareil
  signature    String      // Signature cryptographique
  timestamp    BigInt      // Unix timestamp
  expiresAt    DateTime
  status       TokenStatus @default(ACTIVE)
  usedAt       DateTime?
  usedByDevice String?     // Confirmé après utilisation
  createdBy    String
  admin        Admin       @relation(fields: [createdBy], references: [id])
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@index([deviceId])
  @@index([token])
}

model Activation {
  id            String           @id @default(uuid())
  deviceId      String
  device        Device           @relation(fields: [deviceId], references: [id])
  userId        String
  user          User             @relation(fields: [userId], references: [id])
  status        ActivationStatus @default(PENDING)
  tokenUsed     String?
  activatedAt   DateTime?
  suspendedAt   DateTime?
  revokedAt     DateTime?
  reason        String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@unique([deviceId])
}

model Quota {
  id             String      @id @default(uuid())
  userId         String
  user           User        @relation(fields: [userId], references: [id])
  deviceId       String?
  totalGB        Float       @default(0)
  usedGB         Float       @default(0)
  remainingGB    Float       @default(0)
  resetAt        DateTime?
  policy         QuotaPolicy @default(SUSPEND)
  lastUpdatedAt  DateTime    @default(now())
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@index([userId])
}

model QuotaHistory {
  id         String   @id @default(uuid())
  quotaId    String
  usedGB     Float
  uploadGB   Float
  downloadGB Float
  clientIp   String?
  serverIp   String?
  timestamp  DateTime @default(now())
}

model VpnProfile {
  id          String   @id @default(uuid())
  name        String
  server      String
  port        Int
  protocol    String   // VLESS, VMess, Trojan, WireGuard, etc.
  dns         String?
  network     String?
  certificate String?  @encrypted
  privateKey  String?  @encrypted
  configData  Json?    @encrypted
  priority    Int      @default(0)
  version     Int      @default(1)
  status      String   @default("ACTIVE") // ACTIVE, MAINTENANCE, DISABLED
  publishedAt DateTime?
  createdBy   String
  admin       Admin    @relation(fields: [createdBy], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userProfiles VpnUserProfile[]
}

model VpnUserProfile {
  id           String      @id @default(uuid())
  userId       String
  user         User        @relation(fields: [userId], references: [id])
  deviceId     String?
  device       Device?     @relation(fields: [deviceId], references: [id])
  profileId    String
  profile      VpnProfile  @relation(fields: [profileId], references: [id])
  encryptedConfig String
  status       String      @default("ACTIVE")
  uploadMB     Float       @default(0)
  downloadMB   Float       @default(0)
  lastUsedAt   DateTime?
  expiresAt    DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@unique([userId, deviceId, profileId])
}

model SyncLog {
  id         String   @id @default(uuid())
  deviceId   String
  device     Device   @relation(fields: [deviceId], references: [id])
  clientVersion String?
  configVersion  Int?
  newConfigAvailable Boolean @default(false)
  syncStatus  String   // SUCCESS, PARTIAL, FAILED
  errorMessage String?
  clientIp    String?
  timestamp   DateTime @default(now())
}

model AuditLog {
  id         String   @id @default(uuid())
  action     String
  entity     String?
  entityId   String?
  details    Json?
  adminId    String?
  admin      Admin?    @relation(fields: [adminId], references: [id])
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([adminId])
  @@index([entityId])
}

model Setting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## API Backend

### Authentification Dashboard

```
POST /api/auth/login
  Body: { email, password }
  Response: { token, admin }

POST /api/auth/logout
  Headers: Authorization: Bearer <token>

GET /api/auth/me
  Headers: Authorization: Bearer <token>
  Response: { id, email, name, role }
```

### Gestion des Utilisateurs

```
GET /api/users
  Headers: Authorization: Bearer <token>
  Query: ?page=1&limit=20&status=ACTIVE&search=xxx
  Response: { users[], total, page, limit }

POST /api/users
  Body: { email, phone, name, deviceLimit, quotaGB }
  Response: { user }

PATCH /api/users/:id
  Body: { status, deviceLimit }
  Response: { user }

DELETE /api/users/:id
  Response: { success: true }
```

### Gestion des Appareils

```
GET /api/devices
  Headers: Authorization: Bearer <token>
  Query: ?userId=xxx&status=ACTIVE
  Response: { devices[] }

GET /api/devices/:id
  Response: { device, history[] }

PATCH /api/devices/:id
  Body: { status, deviceName, isCompromised }
  Response: { device }

DELETE /api/devices/:id
  Response: { success: true }

GET /api/devices/:id/history
  Response: { syncLogs[], activations[] }
```

### Génération de Tokens

```
POST /api/tokens/generate
  Headers: Authorization: Bearer <token>
  Body: { deviceId }
  
  Le token est généré avec:
  - deviceId: ID unique de l'appareil
  - timestamp: Unix timestamp actuel
  - signature: HMAC-SHA256(deviceId + timestamp, SERVER_SECRET)
  - token: Base64(deviceId + "." + timestamp + "." + signature)

  Response: { token, expiresAt }

POST /api/tokens/revoke/:id
  Response: { success: true }

GET /api/tokens
  Response: { tokens[] }
```

### Activation Mobile

```
POST /api/mobile/activate
  Body: {
    deviceId: string,
    deviceName: string,
    brand: string,
    model: string,
    osVersion: string,
    appVersion: string,
    androidId: string,
    fingerprint: string,
    publicIp: string,
    country: string,
    token: string
  }

  Le backend vérifie:
  1. Signature du token (HMAC-SHA256)
  2. deviceId correspond à celui du token
  3. Token n'a pas expiré
  4. Token n'a pas été utilisé

  Response: {
    success: true,
    activationId: string,
    profiles: VpnProfile[]
  }

POST /api/mobile/sync
  Headers: X-Device-ID: <deviceId>
  Body: {
    configVersion: number,
    uploadMB: number,
    downloadMB: number
  }

  Response: {
    newConfigAvailable: boolean,
    profiles: VpnProfile[] // si nouvelle version
  }

GET /api/mobile/config/:profileId
  Headers: X-Device-ID: <deviceId>
  Response: {
    config: string (déchiffré),
    version: number
  }

POST /api/mobile/usage
  Headers: X-Device-ID: <deviceId>
  Body: {
    uploadMB: number,
    downloadMB: number,
    sessionDuration: number
  }
```

### Profils VPN

```
GET /api/profiles
  Headers: Authorization: Bearer <token>
  Response: { profiles[] }

POST /api/profiles
  Body: {
    name: string,
    server: string,
    port: number,
    protocol: string,
    dns: string,
    network: string,
    certificate: string (encrypted),
    privateKey: string (encrypted),
    configData: Json
  }
  Response: { profile }

PATCH /api/profiles/:id
  Body: { ...updates }

DELETE /api/profiles/:id

POST /api/profiles/:id/publish
  Incrémente la version et notifie les appareils
```

### Gestion des Quotas

```
GET /api/quotas
  Headers: Authorization: Bearer <token>
  Query: ?userId=xxx
  Response: { quotas[] }

PATCH /api/quotas/:id
  Body: {
    totalGB: number,
    policy: "SUSPEND" | "THROTTLE" | "NOTIFY",
    resetAt: DateTime
  }
  Response: { quota }

GET /api/quotas/:id/usage
  Response: {
    totalGB: number,
    usedGB: number,
    remainingGB: number,
    percentage: number,
    history: QuotaHistory[]
  }
```

### Serveurs

```
GET /api/servers
  Response: { servers[] }

POST /api/servers
  Body: { name, host, port, country, ... }

PATCH /api/servers/:id

DELETE /api/servers/:id
```

### Audit Logs

```
GET /api/audit
  Headers: Authorization: Bearer <token>
  Query: ?action=xxx&entityId=xxx&from=date&to=date
  Response: { logs[], total }
```

---

## Dashboard Administrateur

### Pages

1. **Dashboard** (`/dashboard`)
   - Stats globales en temps réel
   - Graphiques d'utilisation
   - Serveurs en ligne
   - Dernières activations

2. **Utilisateurs** (`/users`)
   - Liste complète avec filtres
   - CRUD utilisateur
   - Attribution quota
   - Limite appareils

3. **Appareils** (`/devices`)
   - Liste tous appareils
   - Détails par appareil
   - Historique sync
   - Bloquer/Supprimer

4. **Tokens** (`/tokens`)
   - Générer token pour appareil
   - Liste tokens actifs/expirés
   - Révocation tokens

5. **Profils VPN** (`/vpn-profiles`)
   - Créer/Modifier profil
   - Protocoles supportés
   - Publication configurations

6. **Quotas** (`/quotas`)
   - Attribution quotas
   - Suivi consommation
   - Politique dépassement

7. **Serveurs** (`/servers`)
   - Gestion serveurs
   - Statut en temps réel

8. **Logs** (`/audit`)
   - Journal complet
   - Filtres avancés

9. **Paramètres** (`/settings`)
   - Configuration système
   - Secrets serveur

---

## Sécurité

### Token Cryptographique

```typescript
// Génération du token
function generateToken(deviceId: string): TokenData {
  const timestamp = BigInt(Date.now());
  const data = `${deviceId}.${timestamp}`;
  const signature = hmacSha256(data, SERVER_SECRET);
  const token = Buffer.from(`${data}.${signature}`).toString('base64url');
  
  return {
    token,
    deviceId,
    timestamp,
    expiresAt: new Date(Number(timestamp) + TOKEN_VALIDITY_MS),
    signature
  };
}

// Vérification du token
function verifyToken(token: string, deviceId: string): boolean {
  const decoded = Buffer.from(token, 'base64url').toString().split('.');
  const [tokenDeviceId, timestampStr, signature] = decoded;
  const timestamp = BigInt(timestampStr);
  
  // Vérifier deviceId
  if (tokenDeviceId !== deviceId) return false;
  
  // Vérifier expiration
  if (Date.now() > Number(timestamp) + TOKEN_VALIDITY_MS) return false;
  
  // Vérifier signature
  const data = `${tokenDeviceId}.${timestampStr}`;
  const expectedSignature = hmacSha256(data, SERVER_SECRET);
  return signature === expectedSignature;
}
```

### Chiffrement Configurations

```typescript
// Chiffrement AES-256-GCM
function encryptConfig(config: string, key: Buffer): EncryptedData {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(config, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    data: encrypted,
    tag: authTag.toString('hex')
  };
}
```

### Sécurité Réseau

- HTTPS obligatoire
- Rate limiting (100 req/min)
- Protection CSRF
- Validation entrée stricte
- Headers sécurisés (HSTS, CSP, etc.)

---

## Flux d'Activation

### Étape 1: Installation
```
Utilisateur installe SXB VPN
→ Application génère deviceId unique
→ Application envoie deviceId au Backend
```

### Étape 2: Génération Token (Dashboard)
```
Admin sélectionne l'appareil dans le dashboard
→ Dashboard appelle POST /api/tokens/generate { deviceId }
→ Backend génère token signé
→ Dashboard affiche le token à l'utilisateur
```

### Étape 3: Activation (Application)
```
Utilisateur saisit le token
→ Application appelle POST /api/mobile/activate {
    deviceId, deviceInfo, token
  }
→ Backend vérifie:
  1. Signature valide
  2. deviceId correspond
  3. Token non expiré
  4. Token non utilisé
→ Backend:
  1. Crée/mise à jour Device
  2. Crée Activation
  3. Marque token comme USED
  4. Retourne profils VPN
→ Application:
  1. Stocke configs localement (chiffrées)
  2. Affiche succès
```

### Étape 4: Synchronisation
```
À chaque ouverture (si Internet disponible):
→ Application appelle POST /api/mobile/sync {
    configVersion,
    uploadMB,
    downloadMB
  }
→ Backend compare versions
→ Si nouvelle config disponible → retourne profils
→ Application met à jour configs locales
```

---

## Gestion des Quotas

### Attribution
- Admin définit quota via Dashboard
- Quota attaché à User ou Device
- Politique configurable (SUSPEND/THROTTLE/NOTIFY)

### Suivi
- Application envoie usage via POST /mobile/usage
- Backend met à jour Quota.usedGB
- Dashboard affiche stats temps réel

### Dépassement
```
Si usedGB >= totalGB:
  Selon policy:
  - SUSPEND: Block VPN, notifier
  - THROTTLE: Limiter vitesse
  - NOTIFY: Alerter seulement
```

---

## Variables d'Environnement

```env
# Backend
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/sxbvpn
REDIS_URL=redis://host:6379

# Sécurité
JWT_SECRET=your-jwt-secret
SERVER_SECRET=your-server-secret
ENCRYPTION_KEY=32-byte-encryption-key

# Dashboard URL
DASHBOARD_URL=https://dashboard.sxbvpn.com

# Vercel (dashboard)
NEXT_PUBLIC_API_URL=https://api.sxbvpn.com
```

---

## Déploiement

### VPS (Backend + PostgreSQL + Redis)
```bash
# SSH
ssh ubuntu@141.95.112.93

# Docker Compose sur le VPS
docker compose up -d
```

### Vercel (Dashboard)
```bash
vercel --prod
```

---

*Document généré pour SXB VPN — Version 1.0*
