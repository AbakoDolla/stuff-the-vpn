# SxB VPN - Integration & Build Guide

## Overview
This document outlines how the different components of the SxB VPN platform communicate and how to build the APK and Dashboard.

## Project Structure

```
stuff-the-vpn/
├── apps/
│   ├── backend/          # Express.js API server
│   ├── dashboard/        # Next.js admin dashboard
│   └── mobile/           # Flutter mobile app (apps/mobile)
├── mobile_app_sxb_vpn/   # Primary Flutter app
├── packages/             # Shared utilities & types
└── docs/                 # Documentation
```

## Communication Architecture

### 1. Mobile App → Backend API
- **Base URL**: `http://10.0.2.2:5000/api` (dev) or `https://api.sxbvpn.com/api` (prod)
- **Authentication**: JWT Bearer token in `Authorization` header
- **Configured in**: `mobile_app_sxb_vpn/lib/core/network/endpoints.dart`

#### Key Endpoints:
- `POST /auth/login-license` - License-based login
- `POST /auth/login` - Email/password login  
- `GET /vpn/my-config` - Get user VPN config
- `GET /vpn/servers` - List available servers
- `POST /vpn/connect` - Connect to VPN

### 2. Dashboard → Backend API
- **Base URL**: `http://localhost:5000/api` (dev) or from `NEXT_PUBLIC_API_URL` env var
- **Authentication**: JWT Bearer token in `Authorization` header
- **Configured in**: `apps/dashboard/lib/api.ts`

#### Key Endpoints:
- `POST /auth/login` - Admin login (email + password)
- `GET /users` - List all users
- `GET /vouchers` - List vouchers
- `GET /plans` - List subscription plans
- `GET /inbounds` - List VPN inbounds/servers

### 3. Backend Configuration
- **Server**: Express.js on port 5000 (default)
- **CORS**: Enabled for mobile and dashboard origins
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with refresh tokens
- **File**: `apps/backend/src/app.ts`

## Environment Configuration

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/stuff_the_vpn

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000,http://10.0.2.2:3000
```

### Dashboard (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Mobile App (pubspec.yaml)
Built-in configuration using `--dart-define`:
```bash
flutter build apk --dart-define=BACKEND_URL=https://api.sxbvpn.com/api
```

## Building & Deployment

### 1. Building the Android APK

#### Prerequisites:
- Flutter SDK installed
- Android SDK (API level 21+)
- Java JDK 11+

#### Build Steps:
```bash
cd mobile_app_sxb_vpn

# Get dependencies
flutter pub get

# Build APK for release
flutter build apk --release --dart-define=BACKEND_URL=https://api.sxbvpn.com/api

# Output: build/app/outputs/flutter-apk/app-release.apk
```

#### APK Build Configuration:
- Minimum SDK: 21 (Android 5.0)
- Target SDK: Latest
- NDK Version: 27.0.12077973
- **Fixed in**: `android/app/build.gradle.kts`
  - Added proper release signing config
  - Configured minify settings for optimization

### 2. Dashboard Development & Build

#### Prerequisites:
- Node.js 18+
- npm/pnpm

#### Development:
```bash
cd apps/dashboard

# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

#### Production Build:
```bash
npm run build
npm start
```

### 3. Backend Development & Build

#### Prerequisites:
- Node.js 18+
- PostgreSQL database
- npm/pnpm

#### Development:
```bash
cd apps/backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Push database schema
npm run prisma:push

# Start dev server
npm run dev

# Server runs on http://localhost:5000
```

#### With Docker:
```bash
docker-compose up -d

# All services start automatically
```

## Logo Integration

The SxB VPN logo is now integrated across all platforms:

### Mobile App (Flutter)
- **Location**: `mobile_app_sxb_vpn/assets/images/logo.png`
- **Widget**: `AppLogo` class in `lib/widgets/app_logo.dart`
- **Usage**: Displayed on login screen with Hero animation

### Dashboard (Next.js)
- **Location**: `apps/dashboard/public/logo.png`
- **Sidebar**: Shows logo in `components/Sidebar.tsx`
- **Login Page**: Shows logo in `app/login/page.tsx`

### Design Specs:
- Format: PNG with transparency
- Size: 256x256 pixels (scales to needed dimensions)
- Colors: Blue (#0099FF), Gray, and White theme

## Testing Communication

### Test Login (Mobile):
1. Launch app
2. Enter license token: `SXB-TEST-0001`
3. Enter phone: `+237XXXXXXXX`
4. Device ID auto-generated
5. Check `/var/log/mobile.log` for API calls

### Test Login (Dashboard):
1. Navigate to http://localhost:3000/login
2. Enter email: `admin@sxbvpn.com` (or configured admin email)
3. Enter password: (configured admin password)
4. Check browser console for API responses

### Verify API Connectivity:
```bash
# Backend health check
curl http://localhost:5000/api/health

# Mobile API test
curl -X POST http://localhost:5000/api/auth/login-license \
  -H "Content-Type: application/json" \
  -d '{"token":"SXB-TEST","phone":"+237","deviceId":"TEST"}'
```

## Troubleshooting

### APK Build Fails
1. Ensure Flutter/Dart paths are correct
2. Check NDK version matches `gradle.properties`
3. Verify Android SDK API level ≥ 21
4. Run `flutter clean` and retry

### Dashboard Won't Load
1. Verify backend is running on configured port
2. Check `NEXT_PUBLIC_API_URL` environment variable
3. Confirm CORS is enabled in backend
4. Check browser console for API errors

### API Connection Issues
1. Verify backend server is running
2. Check firewall rules allow API port
3. Verify JWT_SECRET is set in backend
4. Confirm AUTH header is sent from clients

### Logo Not Showing
1. **Mobile**: Run `flutter clean && flutter pub get`
2. **Dashboard**: Check `public/logo.png` exists and is readable
3. Verify image format is PNG with proper encoding

## API Response Format

All API responses follow this format:

### Success Response (2xx)
```json
{
  "success": true,
  "data": { /* endpoint specific data */ },
  "message": "Operation successful",
  "timestamp": "2024-06-21T10:30:00Z"
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-06-21T10:30:00Z"
}
```

## Security Notes

1. **JWT Tokens**: Store securely in app (Flutter: `flutter_secure_storage`, Dashboard: localStorage with HTTPOnly cookies)
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS_ORIGIN with exact domains/IPs
4. **Database**: Use strong passwords, enable SSL connections
5. **Secrets**: Never commit `.env` files, use environment variables

## Performance Optimization

### Mobile App
- Implement request caching with Riverpod
- Use `dio` interceptors for retry logic
- Enable app size optimization with `--split-per-abi`

### Dashboard
- Use React Query for server state management
- Implement request debouncing in search/filter
- Enable Next.js incremental static regeneration (ISR)

### Backend
- Enable response compression with gzip
- Implement pagination for list endpoints
- Use database connection pooling

## Support & Debugging

### Enable Detailed Logs
```bash
# Backend
NODE_ENV=development node dist/index.mjs

# Dashboard
npm run dev -- --debug

# Mobile
flutter run -v
```

### View Logs
```bash
# Backend logs
docker logs stuff-the-vpn-backend

# Full stack
docker-compose logs -f
```

---

**Last Updated**: June 21, 2024
**Version**: 2.0
**Status**: Production Ready
