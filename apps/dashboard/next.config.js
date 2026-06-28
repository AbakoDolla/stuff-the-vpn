/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  // TypeScript check activé — les erreurs bloquent le build
  typescript: {
    ignoreBuildErrors: false,
  },
  // ESLint désactivé pendant le build (les règles Next.js ne bloquent pas)
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    if (apiUrl.startsWith('http')) {
      return [{ source: '/api/:path*', destination: `${apiUrl}/:path*` }];
    }
    return [];
  },
};

module.exports = nextConfig;
