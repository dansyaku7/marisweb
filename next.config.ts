import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ✅ Pisah jadi 2 object berbeda
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },

  // ✅ eslint dihapus, tidak support di Next.js 16
  
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;