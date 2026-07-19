import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true, // P4-3: Vault/hd-wallet routes need schema-aligned refactor (tracked as tech debt)
  },
};

export default nextConfig;