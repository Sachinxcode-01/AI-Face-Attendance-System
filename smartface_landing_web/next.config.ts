import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strip the framework header and ship gzip/br-compressed responses.
  poweredByHeader: false,
  compress: true,
  // Source maps add weight to production; disable for smaller deploys.
  productionBrowserSourceMaps: false,

  images: {
    // Serve modern, smaller formats when the browser supports them.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Tree-shake large barrel-file packages so only used modules are bundled.
  // This is the main lever for trimming icon/animation/3D payloads.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@react-three/drei",
      "@react-three/fiber",
    ],
  },

  compiler: {
    // Drop console.* (keeping error/warn) from production bundles.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;
