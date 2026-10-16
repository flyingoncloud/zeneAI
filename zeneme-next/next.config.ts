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
      // 情感密室 backend is a sub-app mounted at /api/escape on the FastAPI
      // server. In production nginx proxies /api/* to :8000 so the browser
      // never reaches Next for these; this rewrite only takes effect in local
      // dev (direct hit to :3000), matching that behaviour.
      {
        source: '/api/escape/:path*',
        destination: 'http://localhost:8000/api/escape/:path*',
      },
    ];
  },
};

export default nextConfig;
