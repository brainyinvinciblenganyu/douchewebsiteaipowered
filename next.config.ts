import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'www.datocms-assets.com' },
      { protocol: 'https', hostname: 'www.tebadul.com' },
    ],
  },
};

export default nextConfig;
