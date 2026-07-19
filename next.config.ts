import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: ["**/hd-wallet/**", "**/scripts/**", "**/upload/**"],
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills"],
  },
};

export default nextConfig;