import type { NextConfig } from "next"

const enhancedConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    // Enable modern bundling
    esmExternals: true,
    // Enable SWC minification
    swcMinify: true,
    // Enable modern JavaScript features
    modern: true,
    // Enable React 18 features
    reactRoot: true,
    // Enable server components
    serverComponentsExternalPackages: [],
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    // Enable modern image formats
    formats: ['image/webp', 'image/avif'],
    // Optimize image loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable placeholder blur
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      )
      return config
    },
  }),

  // Webpack optimizations
  webpack: (config: any, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      // Enable tree shaking
      config.optimization.usedExports = true
      config.optimization.sideEffects = false

      // Optimize chunks
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: -5,
            chunks: 'all',
            enforce: true,
          },
        },
      }

      // Enable module concatenation
      config.optimization.concatenateModules = true
    }

    // Resolve optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }

    // Add performance monitoring
    config.plugins.push(
      new (require('webpack')).DefinePlugin({
        'process.env.PERFORMANCE_MONITORING': JSON.stringify(
          process.env.PERFORMANCE_MONITORING === 'true'
        ),
      })
    )

    return config
  },

  // Headers for performance
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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Redirects for SEO and performance
  async redirects() {
    return [
      // Redirect www to non-www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.(?<domain>.*)',
          },
        ],
        destination: 'https://:domain/:path*',
        permanent: true,
      },
    ]
  },

  // Rewrites for API optimization
  async rewrites() {
    return [
      {
        source: '/api/cache/:path*',
        destination: '/api/cache/:path*',
      },
    ]
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Output configuration
  output: 'standalone',

  // Enable compression
  compress: true,

  // Power by header
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // TypeScript configuration
  typescript: {
    // Ignore build errors in production
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // ESLint configuration
  eslint: {
    // Ignore ESLint errors in production
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // Trailing slash
  trailingSlash: false,

  // Base path (if needed)
  basePath: '',

  // Asset prefix (if needed)
  assetPrefix: '',

  // Generate ETags
  generateEtags: true,

  // Enable SWC
  swcMinify: true,

  // Modularize imports
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // Transpile packages
  transpilePackages: [
    '@radix-ui/react-icons',
    '@radix-ui/react-slot',
    'class-variance-authority',
  ],

  // Skip middleware URL normalization
  skipMiddlewareUrlNormalize: true,

  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,

  // Custom server (if needed)
  // customServer: true,

  // Disable x-powered-by header
  poweredByHeader: false,

  // Enable experimental features
  experimental: {
    // Enable app directory
    appDir: true,
    // Enable server actions
    serverActions: true,
    // Enable server components
    serverComponentsExternalPackages: ['@prisma/client'],
    // Enable optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-slot',
    ],
  },
}

export default enhancedConfig


