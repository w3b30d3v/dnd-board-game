/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dnd/shared', '@dnd/ui'],
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
    ],
  },
  // Experimental features that help with SSR
  experimental: {
    // Skip static generation errors and handle them at runtime
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
