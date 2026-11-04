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
  redirects() {
    return Promise.resolve([
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
      {
        source: '/mentor',
        destination: '/mentor/dashboard',
        permanent: false,
      },
      {
        source: '/mentee',
        destination: '/mentee/dashboard',
        permanent: false,
      },
    ]);
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
