# Backend Integration Guide

This document explains how to connect the Dashboard and Mobile app to your VPS backend.

## Architecture Overview

```
┌─────────────────────┐
│   Mobile App        │
│   (Flutter)         │
└──────────┬──────────┘
           │ HTTP/HTTPS
           ▼
┌─────────────────────────────────────┐
│   VPS Backend                       │
│   (Node.js/Express)                 │
│   - API Routes                      │
│   - User Management                 │
│   - Device Management               │
│   - Bandwidth Tracking              │
│   - License Management              │
└────────────────────────────────────┘
           ▲
           │ HTTP/HTTPS (via Next.js proxy)
           │
┌──────────┴──────────┐
│   Dashboard         │
│   (Next.js 14)      │
└─────────────────────┘
```

## VPS Backend Setup

### Step 1: Configure Backend URL

The backend must expose an API at `/api` endpoint with the following structure:

```
GET  /api/mobile/subscription        - Get user subscription status
GET  /api/mobile/sync                - Sync device data
POST /api/mobile/device/activate     - Activate a device
POST /api/mobile/activate            - Activate with license token
GET  /api/admin/stats                - Get system statistics
GET  /api/admin/users                - Get users list
GET  /api/admin/devices              - Get devices list
POST /api/admin/users/create         - Create user
... (and other admin endpoints)
```

### Step 2: CORS Configuration

Your backend must allow requests from:
- Dashboard: `https://stuff-the-vpn-dashboard.vercel.app` (production)
- Dashboard: `http://localhost:3000` (development)

Add to your backend:

```javascript
app.use(cors({
  origin: [
    'https://stuff-the-vpn-dashboard.vercel.app',
    'http://localhost:3000',
  ],
  credentials: true,
}));
```

### Step 3: Authentication

Both applications use Bearer token authentication:

```
Authorization: Bearer <token>
```

Tokens are stored in:
- Dashboard: localStorage (`sxb_token`)
- Mobile: Secure storage (flutter_secure_storage)

## Dashboard Configuration

### Development

1. Copy environment template:
   ```bash
   cd apps/dashboard
   cp .env.backend.example .env.local
   ```

2. Update `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

3. The Dashboard will proxy all `/api/*` requests to your backend

### Production (Vercel)

1. Set environment variable in Vercel project settings:
   ```
   NEXT_PUBLIC_API_URL=https://your-vpn-backend.com
   ```

2. Or leave it empty to use relative paths (Dashboard will handle routing)

## Mobile Configuration

### Step 1: Update Backend URL

Edit `mobile/lib/main.dart` or use environment variables:

```dart
const String BACKEND_URL = 'https://your-vpn-backend.com/api';
```

For Android emulator: Use `http://10.0.2.2:4000/api` (maps to localhost)
For iOS simulator: Use `http://localhost:4000/api`
For physical device: Use actual IP/domain

### Step 2: Build & Deploy

```bash
cd mobile

# Android
flutter build apk --release

# iOS
flutter build ios --release
```

## API Response Format

All endpoints should return JSON in this format:

```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Optional success message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "status": 400
}
```

## Testing Connection

### Dashboard

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try logging in or viewing dashboard
4. Check API calls to `/api/*` endpoints
5. Verify responses contain expected data

### Mobile

1. Build and run the app:
   ```bash
   flutter run --release
   ```

2. Check crash logs:
   ```bash
   flutter logs
   ```

3. The app will show error messages if backend connection fails

## Troubleshooting

### "Cannot connect to backend"

1. Verify backend is running: `curl http://localhost:4000/api/health`
2. Check CORS headers are correct
3. Verify firewall isn't blocking the port
4. Check VPS backend logs for errors

### "Unauthorized" (401)

1. Token may have expired
2. Try logging in again
3. Clear browser localStorage and app storage
4. Check backend authentication middleware

### "No data displayed"

1. Verify API endpoint returns correct data format
2. Check backend database has sample data
3. Review dashboard console for fetch errors
4. Verify authentication token is being sent

## Production Checklist

- [ ] Backend URL configured correctly in Vercel
- [ ] CORS headers properly set on backend
- [ ] SSL/HTTPS enabled for all APIs
- [ ] Database migrations completed
- [ ] Sample data created for testing
- [ ] Error handling tested
- [ ] Rate limiting configured
- [ ] Logging enabled on backend
- [ ] Mobile app built and tested on physical device
- [ ] Dashboard tested in production environment

## Next Steps

1. Provide VPS backend URL and credentials
2. Configure environment variables
3. Test API connections
4. Deploy and monitor
