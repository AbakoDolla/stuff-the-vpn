# Full Backend Connection Testing Checklist

This checklist verifies all components work correctly with your VPS backend.

## Prerequisites

Before starting tests, you need:

- [ ] VPS backend running and accessible
- [ ] Backend API documentation or source code
- [ ] Admin credentials for testing
- [ ] Valid test device token or activation code
- [ ] Network connectivity to VPS

## Phase 1: Backend Availability

- [ ] **Backend Health Check**
  ```bash
  curl http://your-vps-ip:4000/api/health
  ```
  Expected: `{"success": true}`

- [ ] **CORS Headers**
  ```bash
  curl -i http://your-vps-ip:4000/api/health
  ```
  Look for: `Access-Control-Allow-Origin` header

- [ ] **Database Connectivity**
  - Check backend logs show no DB connection errors
  - Verify test data exists in database

## Phase 2: Dashboard Configuration

### Local Development Testing

- [ ] **Create Environment File**
  ```bash
  cd apps/dashboard
  cp .env.backend.example .env.local
  ```

- [ ] **Update API URL**
  ```
  NEXT_PUBLIC_API_URL=http://your-vps-ip:4000
  ```

- [ ] **Test Backend Script**
  ```bash
  NEXT_PUBLIC_API_URL=http://your-vps-ip:4000 node scripts/test-backend.mjs
  ```

- [ ] **Start Dashboard**
  ```bash
  npm run dev
  ```

- [ ] **Check DevTools Network Tab**
  - Open http://localhost:3000
  - Press F12 → Network tab
  - Refresh page
  - Verify `/api/admin/stats` returns data

### Login Testing

- [ ] **Create Test Admin User**
  - Via backend admin panel or API
  - Email: test-admin@example.com
  - Password: test-password-123

- [ ] **Dashboard Login**
  - Navigate to http://localhost:3000/login
  - Enter test credentials
  - Verify redirect to dashboard
  - Check browser network shows successful authentication

- [ ] **Dashboard Data Loading**
  - Verify stats cards show numbers (not loading skeletons)
  - Verify users table populates with real data
  - Verify recent activities show real log entries
  - Verify system status shows backend health

### API Endpoint Testing

Test each critical endpoint:

- [ ] **GET /api/admin/stats**
  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    http://your-vps-ip:4000/api/admin/stats
  ```
  Expected fields: `users`, `devices`, `bandwidth`, `licenses`

- [ ] **GET /api/admin/users**
  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    http://your-vps-ip:4000/api/admin/users?page=1&limit=10
  ```

- [ ] **GET /api/admin/devices**
  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    http://your-vps-ip:4000/api/admin/devices
  ```

- [ ] **POST /api/admin/users** (Create user)
  ```bash
  curl -X POST http://your-vps-ip:4000/api/admin/users \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","email":"test@example.com"}'
  ```

## Phase 3: Mobile App Configuration

### Android Emulator/Device

- [ ] **Update Backend URL**
  Edit `mobile/lib/services/api_service.dart`:
  ```dart
  static String get _baseUrl {
    return 'http://10.0.2.2:4000/api'; // For emulator
    // OR
    return 'http://your-vps-ip:4000/api'; // For physical device
  }
  ```

- [ ] **Build APK**
  ```bash
  cd mobile
  flutter build apk --release
  ```

- [ ] **Install on Emulator**
  ```bash
  flutter install
  ```

- [ ] **Run App**
  ```bash
  flutter run --release
  ```

- [ ] **Check App Logs**
  ```bash
  flutter logs
  ```
  Look for: No crash messages, API connection success messages

### iOS Simulator/Device

- [ ] **Update Backend URL**
  Same as Android in `mobile/lib/services/api_service.dart`
  ```dart
  static String get _baseUrl {
    return 'http://localhost:4000/api'; // For simulator
    // OR
    return 'http://your-vps-ip:4000/api'; // For physical device
  }
  ```

- [ ] **Build iOS**
  ```bash
  cd mobile
  flutter build ios --release
  ```

- [ ] **Run on Simulator**
  ```bash
  flutter run --release
  ```

- [ ] **Monitor Console Output**
  Watch for crash logs and connection messages

### Mobile App Testing

- [ ] **Splash Screen**
  - App launches without crashing
  - Shows initialization progress
  - Completes successfully

- [ ] **Activation Flow**
  - If no stored device: shows activation screen
  - Can enter device token successfully
  - Backend validates token and returns device info

- [ ] **Dashboard Screen**
  - VPN status displays correctly
  - Bandwidth usage shows data
  - Available servers list loads

## Phase 4: Integration Testing

- [ ] **Create User via Dashboard**
  - Dashboard: Users → Create User
  - Mobile: Login with new user
  - Verify mobile shows user's quota

- [ ] **Device Activation via Mobile**
  - Mobile: Activate device with token
  - Dashboard: Check device appears in list
  - Verify device status shows as ACTIVE

- [ ] **Bandwidth Tracking**
  - Mobile: Connect through VPN (if available)
  - Dashboard: Check bandwidth usage updates
  - Verify real-time sync works

- [ ] **User Status Changes**
  - Dashboard: Suspend user
  - Mobile: Attempt login with suspended user
  - Verify appropriate error message

## Phase 5: Error Handling

- [ ] **Network Disconnection**
  - Mobile: Disable WiFi/data during connection
  - Verify app shows error, not crash
  - Re-enable network and retry works

- [ ] **Invalid Token**
  - Clear mobile app storage
  - Manual auth token corruption test
  - Verify graceful logout to login screen

- [ ] **Backend Timeout**
  - Stop backend temporarily
  - Try API call from mobile/dashboard
  - Verify timeout error shown (after 10s)

- [ ] **Invalid Response Format**
  - Backend returns malformed JSON
  - Verify graceful error handling
  - No app crash

## Phase 6: Production Readiness

- [ ] **Vercel Deployment**
  - Set `NEXT_PUBLIC_API_URL` in Vercel project settings
  - Deploy dashboard
  - Test dashboard connects to VPS backend

- [ ] **Mobile Release Build**
  - Create signed APK/IPA for release
  - Update backend URL in build
  - Test on real device

- [ ] **SSL/HTTPS**
  - Backend uses HTTPS certificate
  - Mobile app accepts certificate
  - No SSL verification errors

- [ ] **Rate Limiting**
  - Backend implements rate limits
  - Test rapid API calls are throttled
  - Verify friendly error messages

- [ ] **Logging & Monitoring**
  - Check backend logs for errors
  - Verify crash service logs work on mobile
  - Monitor dashboard analytics

## Phase 7: Performance Testing

- [ ] **Load Time**
  - Dashboard stats load in < 2 seconds
  - Users table loads in < 3 seconds
  - Mobile app launches in < 5 seconds

- [ ] **Data Sync**
  - Mobile syncs data every 60 seconds
  - No excessive battery drain
  - No excessive data usage

- [ ] **Concurrent Users**
  - Backend handles multiple users simultaneously
  - Dashboard works with many API requests
  - No timeout or 503 errors

## Sign-Off

Once all tests pass:

- [ ] Document any custom API endpoints or changes
- [ ] Update BACKEND_INTEGRATION.md with final configuration
- [ ] Create runbook for future deployments
- [ ] Brief team on testing results

**Testing Completed By:** ___________________

**Date:** ___________________

**Notes:** ___________________

---

## Troubleshooting Reference

If tests fail, refer to:
- `BACKEND_INTEGRATION.md` - Setup and configuration guide
- `apps/dashboard/scripts/README.md` - Backend testing script
- Backend logs - Check server-side errors
- Mobile logs - Run `flutter logs` for app errors
- Browser DevTools - Check network requests and console errors
