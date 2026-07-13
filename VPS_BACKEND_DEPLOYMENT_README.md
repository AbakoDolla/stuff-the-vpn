# SXB VPN Backend - VPS Deployment Guide

## Quick Summary

I've prepared everything for you to deploy the backend to your VPS. Due to sandbox restrictions, you'll need to execute the deployment script on your VPS yourself using SSH.

---

## VPS Information

| Item | Value |
|------|-------|
| **Hostname** | 141.95.112.93 |
| **SSH Port** | 22 |
| **Username** | ubuntu |
| **Password** | stuffNation321 |
| **Backend Port** | 4000 |

---

## 3-Step Quick Deployment

### Step 1: Connect to VPS

```bash
ssh ubuntu@141.95.112.93
# Enter password: stuffNation321
```

### Step 2: Clone Repository

```bash
git clone https://github.com/AbakoDolla/stuff-the-vpn.git
cd stuff-the-vpn/apps/backend
```

### Step 3: Run Deployment Script

Option A - If you have the script file:
```bash
bash vps-backend-deploy.sh
```

Option B - Or create and run inline:
```bash
# Copy the entire vps-backend-deploy.sh content and run it
bash vps-backend-deploy.sh
```

---

## What the Deployment Script Does

The `vps-backend-deploy.sh` script automates:

1. **Repository Management**
   - Clones or updates from GitHub
   - Pulls latest changes from `v0/abakodolla-bc913eef` branch

2. **Dependencies**
   - Installs Node.js packages (production mode)

3. **Build**
   - Compiles TypeScript to JavaScript
   - Generates optimized build

4. **Configuration**
   - Creates `.env` file with production settings
   - Sets up database and authentication credentials

5. **Service Start**
   - Starts backend on port 4000
   - Runs as background process
   - Saves PID for management

6. **Verification**
   - Checks if process is running
   - Displays success message with connection details

---

## Backend Management Commands

### View Logs
```bash
# Real-time logs
tail -f /tmp/backend.log

# Last 50 lines
tail -50 /tmp/backend.log
```

### Check Status
```bash
# Process running?
ps aux | grep 'npm start' | grep -v grep

# Get PID
cat /tmp/backend.pid

# Check port
netstat -tuln | grep 4000
```

### Control Backend
```bash
# Stop backend
pkill -f 'npm start'

# Restart backend
cd /home/ubuntu/stuff-the-vpn/apps/backend && npm start
```

---

## Testing the Backend

### Health Check
```bash
curl http://141.95.112.93:4000/health
```

### Admin Login
```bash
curl -X POST http://141.95.112.93:4000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sxbvpn.com","password":"SxBvpn2026!"}'
```

### List Devices
```bash
# First get token from login response
TOKEN="<token-from-login>"

curl -X GET http://141.95.112.93:4000/api/devices \
  -H "Authorization: Bearer $TOKEN"
```

---

## Environment Configuration

The deployment script creates this `.env` file automatically:

```env
PORT=4000
NODE_ENV=production
DATABASE_URL=postgresql://sxbvpn:sxbvpn_secret@localhost:5432/sxbvpn
JWT_SECRET=sxbvpn_super_secret_jwt_key_min_32_chars_production
CORS_ORIGIN=*
ADMIN_EMAIL=admin@sxbvpn.com
ADMIN_PASSWORD=SxBvpn2026!
LOG_LEVEL=info
```

**Note:** Update `DATABASE_URL` if your PostgreSQL credentials are different.

---

## Troubleshooting

### "npm: command not found"
```bash
sudo apt-get update
sudo apt-get install -y nodejs npm
```

### "git: command not found"
```bash
sudo apt-get install -y git
```

### "Port 4000 already in use"
```bash
lsof -i :4000           # Find what's using port 4000
kill -9 <PID>           # Kill the process
```

### "Database connection failed"
1. Check if PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Check database credentials
4. Update `.env` if needed: `nano /home/ubuntu/stuff-the-vpn/apps/backend/.env`

### Backend crashes on start
1. Check logs: `tail -50 /tmp/backend.log`
2. Look for specific error messages
3. Ensure all dependencies are installed: `npm install`
4. Try manual start: `npm start`

---

## After Deployment

Once backend is running:

1. **Verify it's accessible**
   ```bash
   curl http://141.95.112.93:4000/health
   ```

2. **Deploy Dashboard** (Next.js on port 3000)
   - See DEPLOYMENT_GUIDE.md for instructions

3. **Build and Distribute Mobile APK**
   - Flutter build ready

4. **Configure Production Settings**
   - Enable HTTPS/SSL
   - Configure firewall rules
   - Setup monitoring and alerting

---

## Complete Deployment Files

This repository includes:

- **vps-backend-deploy.sh** - Automated deployment script
- **DEPLOYMENT_GUIDE.md** - Complete deployment instructions
- **DEPLOYMENT_COMPLETE.md** - System status and build info
- **deploy.sh** - Local deployment automation
- **VPS_DEPLOYMENT_INSTRUCTIONS.txt** - Step-by-step guide

---

## Support

For issues or questions:

1. Check logs on VPS: `tail -50 /tmp/backend.log`
2. Review troubleshooting section above
3. Check GitHub: https://github.com/AbakoDolla/stuff-the-vpn
4. Review DEPLOYMENT_GUIDE.md for detailed information

---

## Next Steps

1. ✅ SSH to VPS and run deployment script
2. ⏳ Backend will be running on http://141.95.112.93:4000
3. ⏳ Deploy Dashboard to port 3000
4. ⏳ Distribute Mobile APK
5. ⏳ Configure SSL/TLS and firewall

---

**Created:** July 13, 2026  
**Status:** Ready for Deployment  
**Backend Version:** Latest from GitHub
