import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: false, // WO-0009: enabled for type safety
  },
  reactStrictMode: true, // WO-0008: enabled for React best practices
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors https://blog-journal.pages.dev",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
