module.exports = {
  apps: [{
    name: 'sxbvpn-backend',
    script: './dist/index.mjs',
    cwd: '/home/ubuntu/stuff-the-vpn/apps/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
    }
  }]
};ENDCONFIG
