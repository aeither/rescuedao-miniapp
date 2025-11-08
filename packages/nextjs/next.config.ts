import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  webpack: config => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Ignore react-native-async-storage for MetaMask SDK in browser
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };

    // Suppress warnings for known issues
    config.ignoreWarnings = [{ module: /node_modules\/@walletconnect/ }, { message: /indexedDB/ }];

    return config;
  },
};

const isIpfs = process.env.NEXT_PUBLIC_IPFS_BUILD === "true";

if (isIpfs) {
  nextConfig.output = "export";
  nextConfig.trailingSlash = true;
  nextConfig.images = {
    unoptimized: true,
  };
} else {
  // Configure remote image patterns for Farcaster profile pictures
  nextConfig.images = {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  };
}

module.exports = nextConfig;
