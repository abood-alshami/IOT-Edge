/**
 * Next.js configuration for IoT Edge backend
 * ES Module format
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Modify webpack config to support aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',  // Allow importing from project root with @/
    };
    return config;
  },
  // Server configuration
  serverRuntimeConfig: {
    port: process.env.PORT || 5000
  }
};

// Using ES modules export syntax
export default nextConfig;
