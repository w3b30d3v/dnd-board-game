/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dnd/shared', '@dnd/ui'],
  // Enable standalone output for Docker deployment
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dndboard.game',
      },
      {
        protocol: 'https',
        hostname: '*.nanobananaapi.ai',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  // Experimental features that help with SSR
  experimental: {
    // Skip static generation errors and handle them at runtime
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
