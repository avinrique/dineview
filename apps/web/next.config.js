/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.API_ORIGIN || 'http://127.0.0.1:4000';

const nextConfig = {
  transpilePackages: ['@dineview/shared'],
  // socket.io polls `/socket.io/?EIO=4…`; the default trailing-slash redirect breaks it
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
    ],
  },
  // Everything the browser needs from the API goes through this origin, so the
  // app works from a phone over HTTPS (LAN cert or tunnel) with no CORS setup.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API_ORIGIN}/uploads/:path*` },
      { source: '/socket.io/', destination: `${API_ORIGIN}/socket.io/` },
      { source: '/socket.io/:path*', destination: `${API_ORIGIN}/socket.io/:path*` },
    ];
  },
  // iOS only opens AR Quick Look for USDZ served with its model type
  async headers() {
    return [{ source: '/:path(.+\\.usdz)', headers: [{ key: 'Content-Type', value: 'model/vnd.usdz+zip' }] }];
  },
};

module.exports = nextConfig;
