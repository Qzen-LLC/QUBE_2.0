import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  reactStrictMode: false, // Disable strict mode to prevent double API calls in development
  // Vercel handles output automatically, no need for standalone mode
  // output: 'standalone', // Only needed for self-hosting/Docker

  // Allow cross-origin requests from ngrok domain in development
  allowedDevOrigins: ['https://potlike-margo-risibly.ngrok-free.dev'],

  // Ignore TypeScript errors during build to avoid scanning issues
  typescript: {
    ignoreBuildErrors: true,
  },
  // Note: ESLint configuration is now handled via eslint.config.js or .eslintrc.json
  // The eslint option in next.config.ts is no longer supported in Next.js 16

  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Disable image optimization in development to avoid private IP resolution issues
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vgwacd4qotpurdv6.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  

  pageExtensions: ["ts", "tsx", "js", "jsx"],

  serverExternalPackages: [
    "@prisma/client",
    "@opentelemetry/api",
    "@opentelemetry/sdk-node",
    "@opentelemetry/auto-instrumentations-node",
    "@opentelemetry/exporter-trace-otlp-grpc"
  ],

  experimental: {
    // Enable modern JavaScript features
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', 'chart.js'],
  },
  
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Optimize headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;