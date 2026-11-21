import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // hide the animated Next.js badge shown in dev while compiling/rendering;
  // the app shows its own spinner. Errors still open the dev overlay.
  devIndicators: false,
};

export default nextConfig;
