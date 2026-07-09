# Dashboard Scripts

Utility scripts for testing and managing the dashboard.

## test-backend.mjs

Automated test script to verify backend connectivity and API functionality.

### Usage

```bash
# Test with default backend (localhost:4000)
node scripts/test-backend.mjs

# Test with custom backend URL
NEXT_PUBLIC_API_URL=https://your-vpn-backend.com node scripts/test-backend.mjs
```

### What it Tests

1. **Health Check** - Verifies backend is running and responsive
2. **CORS Configuration** - Checks if CORS headers are properly set
3. **Stats Endpoint** - Validates admin stats API response
4. **Users Endpoint** - Validates users list API response
5. **Devices Endpoint** - Validates devices list API response
6. **Mobile Subscription** - Validates mobile API endpoints

### Expected Output

```
🚀 Backend Connection Test Suite

Backend URL: http://localhost:4000
API Base: http://localhost:4000/api

⏳ Testing: Backend Health Check
✅ PASS: Backend Health Check

⏳ Testing: CORS Configuration
   CORS headers detected
✅ PASS: CORS Configuration

... (more tests)

==================================================
✅ All tests passed! (6/6)
```

### Troubleshooting

**"Cannot connect to backend"**
- Ensure backend is running: `curl http://localhost:4000/api/health`
- Check backend logs for errors
- Verify firewall allows connection

**"CORS headers not detected"**
- Configure CORS in backend (see BACKEND_INTEGRATION.md)
- May cause issues in production

**"HTTP 401 on admin endpoints"**
- This is expected if no authentication token is set
- Admin endpoints require valid JWT token
- Mobile subscription endpoint returning 401 is normal without auth

### Exit Codes

- `0` - All tests passed ✅
- `1` - Some tests failed ⚠️

## Adding More Tests

To add new tests to `test-backend.mjs`:

```javascript
// Add a new async function
async function myNewTest() {
  const res = await fetch(`${API_BASE}/some-endpoint`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // Add validation logic
}

// Add to results array
results.push(await test('My New Test Name', myNewTest));
```
