import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Unblocks HMR when using the Network URL instead of localhost (IP may change with DHCP).
  allowedDevOrigins: ["172.25.32.1"],
};

export default nextConfig;
