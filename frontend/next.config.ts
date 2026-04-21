import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },

  // Proxy /api requests to the backend service at runtime.
  // No hardcoded NEXT_PUBLIC_API_URL needed at build time.
  // Railway sets BACKEND_URL as an env var in the container.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL ?? "http://localhost:8080"}/api/:path*`,
      },
      {
        source: "/ws/:path*",
        destination: `${process.env.BACKEND_URL ?? "http://localhost:8080"}/ws/:path*`,
      },
    ];
  },


  // Strict mode for better development error detection
  reactStrictMode: true,

  // Disable source maps in production for smaller builds
  productionBrowserSourceMaps: false,
};

export default nextConfig;
