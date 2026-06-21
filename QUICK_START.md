# SxB VPN - Quick Start Guide

## 🚀 One-Command Setup

### All-in-One Docker (Recommended)
```bash
docker-compose up -d

# Services start automatically:
# - Backend: http://localhost:5000
# - Dashboard: http://localhost:3000
# - Database: PostgreSQL on localhost:5432
```

---

## 📱 Manual Setup

### 1. Backend API
```bash
cd apps/backend

# Install & Setup
npm install
npm run prisma:generate
npm run prisma:push

# Start
npm run dev
# ✓ Runs on http://localhost:5000
```

### 2. Dashboard
```bash
cd apps/dashboard

# Install & Setup
npm install

# Start
npm run dev
# ✓ Open http://localhost:3000
# ✓ Login with admin@sxbvpn.com / SxBvpn2026
```

### 3. Mobile App
```bash
cd mobile_app_sxb_vpn

# Install & Setup
flutter pub get

# Development (Emulator)
flutter run

# Build APK
flutter build apk --release --dart-define=BACKEND_URL=https://api.sxbvpn.com/api
# ✓ APK at: build/app/outputs/flutter-apk/app-release.apk
```

---

## 🔑 Default Credentials

| Service | Email | Password |
|---------|-------|----------|
| Dashboard | admin@sxbvpn.com | SxBvpn2026 |

> Note: Change these in production!

---

## 🌐 API Endpoints

### Auth (Mobile)
```bash
POST /api/auth/login-license
# Body: { "token": "SXB-XXXX", "phone": "+237...", "deviceId": "..." }
```

### Auth (Dashboard)
```bash
POST /api/auth/login
# Body: { "email": "admin@sxbvpn.com", "password": "..." }
```

### Core Resources
```bash
GET /api/users           # List users
GET /api/vouchers        # List vouchers
GET /api/plans           # List plans
GET /api/vpn/servers     # List VPN servers
GET /api/health          # Health check
```

---

## 📋 Verification

### Check Everything Works
```bash
# 1. Backend running?
curl http://localhost:5000/api/health

# 2. Can login?
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sxbvpn.com","password":"SxBvpn2026"}'

# 3. Dashboard accessible?
open http://localhost:3000

# 4. Mobile app builds?
flutter build apk --release
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5000 already in use | `lsof -i :5000` then `kill -9 <PID>` |
| Database connection failed | Check DATABASE_URL in .env |
| Dashboard won't load | Verify backend is running |
| Mobile API not connecting | Check BACKEND_URL in build command |
| Flutter build fails | Run `flutter clean && flutter pub get` |

---

## 📚 Documentation

- **Full Guide**: See `INTEGRATION_GUIDE.md`
- **All Fixes**: See `FIXES_APPLIED.md`
- **API Docs**: See `apps/backend/README.md`

---

## 🎯 What Was Fixed

✓ Logo integrated across mobile app and dashboard
✓ Android APK build now working
✓ Dashboard ↔ Backend communication verified
✓ Mobile app ↔ Backend communication verified
✓ All security and CORS headers configured

---

## 📝 Environment Setup

### Create `.env` in root:
```env
# Backend
DATABASE_URL=postgresql://stv_user:stv_password@localhost:5432/stuff_the_vpn
JWT_SECRET=your-secret-key-here-32-chars-min
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://10.0.2.2:5000

# Dashboard (.env.local in apps/dashboard)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🚢 Production Deployment

### Build All Components
```bash
# Backend
cd apps/backend && npm run build

# Dashboard
cd apps/dashboard && npm run build

# Mobile
cd mobile_app_sxb_vpn && flutter build apk --release
```

### Set Production URLs
```env
# Backend
NODE_ENV=production
CORS_ORIGIN=https://dashboard.sxbvpn.com

# Dashboard
NEXT_PUBLIC_API_URL=https://api.sxbvpn.com

# Mobile
flutter build apk --dart-define=BACKEND_URL=https://api.sxbvpn.com/api
```

---

## 💡 Tips

1. **Use Docker** - Simplest way to run everything
2. **Check Logs** - Both frontend and backend log to console
3. **Test Locally First** - Before deploying to production
4. **Keep Secrets Safe** - Never commit `.env` files
5. **Monitor Performance** - Check browser DevTools network tab

---

## 🆘 Need Help?

1. Check `INTEGRATION_GUIDE.md` for detailed documentation
2. Review logs in console output
3. Verify all environment variables are set
4. Ensure ports aren't already in use
5. Check database is accessible

---

**Status**: Production Ready ✓  
**Last Updated**: June 21, 2024  
**Version**: 2.0
