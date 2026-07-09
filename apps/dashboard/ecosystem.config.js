module.exports = {
  apps: [{
    name: 'sxbvpn-dashboard',
    script: '/home/ubuntu/stuff-the-vpn/node_modules/next/dist/bin/next',
    args: 'start -p 3001',
    cwd: '/home/ubuntu/stuff-the-vpn/apps/dashboard',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      NEXT_PUBLIC_API_URL: 'http://localhost/api'
    }
  }]
};
