import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    // Type errors now fail the build (security-relevant type bugs surface early).
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Native / WASM addons used by Document Intelligence & RAG. Keep them out of the
  // webpack/turbopack bundle so their runtime binaries and model loading work.
  serverExternalPackages: [
    "@huggingface/transformers",
    "onnxruntime-node",
    "tesseract.js",
    "unpdf",
    "sharp",
  ],
  async headers() {
    // Baseline security headers for all page/document responses.
    // (API responses get their headers from src/proxy.ts.)
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default nextConfig;
