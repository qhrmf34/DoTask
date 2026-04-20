/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4200';

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
      //  여기에 에러가 났던 호스트 정보를 추가합니다.
      {
        protocol: 'http',
        hostname: '220.76.86.151',
        port: '4200',
      },
      // 로컬 테스트 환경을 위해 localhost도 추가해두면 좋습니다.
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4200',
      },
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