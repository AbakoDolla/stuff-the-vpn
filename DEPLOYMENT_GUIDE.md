# SXB VPN - Complete Deployment & Testing Guide

## Overview

This guide provides step-by-step instructions for deploying and testing the complete SXB VPN system including backend API, admin dashboard, and mobile application.

## System Requirements

### Backend
- Node.js 18+ 
- PostgreSQL 15+
- Redis 6+
- 1GB+ RAM
- 2GB+ disk space

### Dashboard
- Node.js 18+
- 512MB+ RAM
- 1GB+ disk space

### Mobile
- Flutter 3.44.6+
- Android SDK 13+
- 2GB+ RAM
- 5GB+ disk space (for build)

## Quick Start (5 minutes)

### 1. Clone and Setup
```bash
# Already done, but reference:
git clone https://github.com/AbakoDolla/stuff-the-vpn.git
cd stuff-the-vpn
```

### 2. One-Command Deployment
```bash
# Deploy all components
./deploy.sh all

# Or deploy individually
./deploy.sh backend      # Just backend
./deploy.sh dashboard    # Just dashboard
./deploy.sh mobile       # Just mobile APK
```

### 3. Access the System
- **Dashboard:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Login:** admin@sxbvpn.com / SxBvpn2026!

---

## Detailed Deployment

### Step 1: Backend API Deployment

#### Configure Environment
```bash
cd apps/backend

# Create .env file
cat > .env << 'ENV'
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://sxbvpn:sxbvpn_secret@localhost:5432/sxbvpn
REDIS_URL=redis://localhost:6379
JWT_SECRET=sxbvpn_super_secret_jwt_key_min_32_chars
CORS_ORIGIN=http://localhost:3000,*
ADMIN_EMAIL=admin@sxbvpn.com
ADMIN_PASSWORD=SxBvpn2026!
ENV
```

#### Build Backend
```bash
npm install
npm run build
```

#### Start Backend
```bash
npm start
# Output: Backend running on port 4000
```

#### Verify Backend
```bash
# Test API health
curl http://localhost:4000/health

# Test login
curl -X POST http://localhost:4000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sxbvpn.com","password":"SxBvpn2026!"}'
```

---

### Step 2: Dashboard Deployment

#### Configure Environment
```bash
cd apps/dashboard

# Create .env.local
cat > .env.local << 'ENV'
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
ENV
```

#### Build Dashboard
```bash
npm install
npm run build
```

#### Start Dashboard
```bash
npm start
# Output: Dashboard running on http://localhost:3000
```

#### Access Dashboard
1. Open http://localhost:3000
2. Login with:
   - Email: admin@sxbvpn.com
   - Password: SxBvpn2026!
3. You should see the admin dashboard with device management

---

### Step 3: Mobile App Build

#### Setup Flutter
```bash
cd apps/mobile

# Ensure Flutter is installed
flutter --version

# Get dependencies
flutter pub get
```

#### Build Debug APK (for testing)
```bash
flutter build apk --debug
# Output: build/app/outputs/flutter-apk/app-debug.apk
```

#### Build Release APK (for distribution)
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

#### Test on Device
```bash
# Connect device and run
flutter run

# Or install APK directly
adb install build/app/outputs/flutter-apk/app-release.apk
```

---

## Endpoint Testing

### Authentication

**Login (Admin)**
```bash
POST http://localhost:4000/api/auth/admin/login
Content-Type: application/json

{
  "email": "admin@sxbvpn.com",
  "password": "SxBvpn2026!"
}

# Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "admin": { ... }
  }
}
```

### Device Management

**List Devices**
```bash
GET http://localhost:4000/api/devices
Authorization: Bearer <token>

# Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "deviceId": "AQ3A.240929.001",
      "status": "ACTIVE",
      "deviceName": "Stuffphone",
      "createdAt": "2026-07-13T02:00:00Z"
    }
  ]
}
```

**Get Device by ID**
```bash
GET http://localhost:4000/api/devices/:id
Authorization: Bearer <token>
```

**Update Device**
```bash
PATCH http://localhost:4000/api/devices/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceName": "New Name",
  "status": "ACTIVE"
}
```

**Block Device**
```bash
POST http://localhost:4000/api/devices/:id/block
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Suspicious activity"
}
```

### Token Management

**Generate Token**
```bash
POST http://localhost:4000/api/tokens/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceId": "AQ3A.240929.001"
}

# Response:
{
  "success": true,
  "data": {
    "token": "SXB-XXXX-XXXX",
    "expiresAt": "2026-08-13T02:00:00Z"
  }
}
```

**List Tokens**
```bash
GET http://localhost:4000/api/tokens
Authorization: Bearer <token>
```

**Revoke Token**
```bash
POST http://localhost:4000/api/tokens/:id/revoke
Authorization: Bearer <token>
```

---

## Dashboard Features

### Device Management
- View all registered devices
- See device status (Active, On Hold, Blocked, etc.)
- Approve/Reject device requests
- View device activation details
- Monitor device usage and quotas

### Token Generation
- Generate activation tokens for devices
- Manage token lifecycle
- Revoke compromised tokens
- Track token usage

### User Management
- Manage admin accounts
- View user activity logs
- Manage permissions

### Server Settings
- Configure VPN servers
- Manage inbound/outbound rules
- Monitor server status
- View traffic statistics

---

## Troubleshooting

### Backend Issues

**Error: EADDRINUSE (port already in use)**
```bash
# Kill process on port 4000
lsof -i :4000
kill -9 <PID>

# Or change port in .env
PORT=5000
```

**Error: FATAL: Peer authentication failed**
```bash
# Database connection failed, check:
# 1. PostgreSQL is running
# 2. DATABASE_URL is correct in .env
# 3. Database credentials are valid
```

**Error: Unexpected token '<'**
```bash
# Backend crashed and returned HTML error page
# Check logs for the actual error:
npm start 2>&1 | tail -50
```

### Dashboard Issues

**Error: Cannot fetch devices**
```bash
# 1. Check backend is running: curl http://localhost:4000
# 2. Check NEXT_PUBLIC_API_URL in .env.local
# 3. Check browser console for CORS errors
```

**Error: Login failed**
```bash
# 1. Verify admin credentials
# 2. Check backend auth endpoint: 
curl -X POST http://localhost:4000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sxbvpn.com","password":"SxBvpn2026!"}'
```

### Mobile Issues

**Error: Failed to connect to backend**
```bash
# 1. Check mobile backend URL configuration
# 2. Ensure device can reach backend server
# 3. For local development, use appropriate IP instead of localhost
```

**Error: Device activation fails**
```bash
# 1. Verify UUID format is valid
# 2. Check token generation endpoint is working
# 3. Look at backend logs for specific error
```

---

## Performance Optimization

### Backend Optimization
```bash
# Enable Redis caching
REDIS_ENABLED=true

# Increase database connection pool
DATABASE_POOL_SIZE=20

# Enable request compression
COMPRESSION_ENABLED=true
```

### Dashboard Optimization
```bash
# Build with production optimizations
npm run build

# Enable static optimization
NEXT_STATIC_GENERATION=true
```

### Mobile Optimization
```bash
# Build with optimizations
flutter build apk --release --split-per-abi

# Use R8 minification
flutter build apk --release --obfuscate --split-debug-info=build/app/outputs/symbols
```

---

## Monitoring & Logging

### Backend Logs
```bash
# View real-time logs
npm start 2>&1 | tee backend.log

# Check specific errors
grep "ERROR" backend.log
```

### Dashboard Logs
```bash
# Next.js logs
npm start 2>&1 | tee dashboard.log
```

### Mobile Logs
```bash
# Flutter logs
flutter logs

# ADB logs
adb logcat | grep "flutter"
```

---

## Security Checklist

- [ ] Change all default credentials
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Setup firewall rules
- [ ] Enable database encryption
- [ ] Setup regular backups
- [ ] Enable audit logging
- [ ] Configure API key rotation
- [ ] Setup monitoring & alerts

---

## Support

For issues or questions, refer to:
1. DEPLOYMENT_COMPLETE.md - Comprehensive status report
2. Backend logs: `apps/backend/logs/`
3. Dashboard logs: `apps/dashboard/.next/`
4. GitHub Issues: https://github.com/AbakoDolla/stuff-the-vpn/issues

---

**Last Updated:** July 13, 2026  
**Status:** Production Ready
