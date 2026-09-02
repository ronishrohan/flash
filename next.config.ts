import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pi AI uses Node-only dynamic imports for provider loading. Keep it out of
  // the RSC/Turbopack bundle and let the route handler load it natively.
  serverExternalPackages: ["@earendil-works/pi-ai"],
};

export default nextConfig;
