import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Google loads `/metrics/`; the default redirect to `/metrics` breaks the tag URL.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
