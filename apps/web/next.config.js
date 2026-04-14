/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${API_URL}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
