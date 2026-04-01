import type { NextConfig } from "next";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-config";

let nextConfig: NextConfig = {
  /* config options here */
};

if (process.env.NODE_ENV === "development") {
  nextConfig = setupDevPlatform(nextConfig);
}

export default nextConfig;
