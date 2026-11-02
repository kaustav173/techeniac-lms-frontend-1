import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  rewrites() {
    const rawTarget =
      process.env.BACKEND_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://TechEniac-lms-backend.onrender.com/api/v1'
        : 'http://localhost:4000/api/v1');
    const normalizedTarget = rawTarget.replace(/\/+$/, '');

    return Promise.resolve([
      {
        source: '/api/v1/:path*',
        destination: `${normalizedTarget}/:path*`,
      },
    ]);
  },
};

export default nextConfig;
