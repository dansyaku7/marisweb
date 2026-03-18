import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "res.cloudinary.com",
        protocol: "https",
        hostname: '*.public.blob.vercel-storage.com'
      },
    ],
  },

    // Untuk mengabaikan error ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Untuk mengabaikan error TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
