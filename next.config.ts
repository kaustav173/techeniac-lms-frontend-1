import type { NextConfig } from 'next';

const reportOnlyCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentUpgrade: 'security',
  },
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
  headers() {
    const productionHeaders =
      process.env.NODE_ENV === 'production'
        ? [
            { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
            { key: 'Content-Security-Policy-Report-Only', value: reportOnlyCsp },
          ]
        : [];

    return Promise.resolve([
      {
        source: '/((?!api/v1(?:/|$)).*)',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          ...productionHeaders,
        ],
      },
      {
        source: '/reset-password',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
    ]);
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
