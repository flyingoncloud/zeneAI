import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  /**
   * Pin the workspace root to this directory.
   *
   * Next infers the root from the nearest lockfile, and a stray
   * package-lock.json in the repo root (one showed up on the production host
   * from an `npm install` run one directory too high) makes it pick the repo
   * root instead — which means file tracing runs against the wrong tree. The
   * app directory is the answer whatever else is lying around above it.
   */
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:8000/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
