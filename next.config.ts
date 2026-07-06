import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Content-Security-Policy", value: "default-src self; script-src self unsafe-inline unsafe-eval; style-src self unsafe-inline; img-src self data blob; font-src self data; connect-src self ws wss http://localhost:* http://21.0.21.151:*; frame-ancestors self" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: false },
  reactStrictMode: false,
  allowedDevOrigins: ["preview-chat-3bbd5192-4e19-41cf-a6c0-aad62211ca56.space-z.ai"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/dashboard", destination: "/", permanent: true },
    ];
  },
  async rewrites() {
    return [{ source: "/ws/:path*", destination: "/?XTransformPort=3003" }];
  },
};

export default nextConfig;