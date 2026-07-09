module.exports = {
  apps: [{
    name: 'sxbvpn-backend',
    script: 'apps/backend/dist/index.mjs',
    cwd: '/home/ubuntu/stuff-the-vpn',
    env: {
      DATABASE_URL: 'postgresql://sxbvpn:stuffNation321@localhost:5432/sxbvpn',
      REDIS_URL: 'redis://localhost:6379',
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
};
