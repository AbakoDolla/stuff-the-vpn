/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  // TODO: re-disable once all pages are TypeScript-clean
  typescript: {
    ignoreBuildErrors: true,
  },
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
