import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Unblocks HMR when using the Network URL instead of localhost (IP may change with DHCP).
  // 127.0.0.1: Playwright e2e uses this host in baseURL while Next prints localhost.
  allowedDevOrigins: ["172.25.32.1", "127.0.0.1", "192.168.1.57"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
