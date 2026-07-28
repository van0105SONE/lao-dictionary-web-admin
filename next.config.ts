import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Firebase Admin SDK (Node.js-only) is never bundled into client chunks.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
