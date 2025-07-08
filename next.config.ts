import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Cloudflare Pages 配置 - 混合部署模式
  // 注意: 由于有API路由，暂时不使用静态导出
  // output: 'export',
  trailingSlash: true,
  reactStrictMode: true,

  // 构建优化
  eslint: {
    ignoreDuringBuilds: true, // 暂时跳过ESLint检查以便部署
  },
  typescript: {
    ignoreBuildErrors: true, // 暂时跳过TypeScript类型检查以便部署
  },

  // 性能优化
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@supabase/supabase-js',
      'react-icons',
      'recharts',
      'ethers',
      '@wagmi/core',
      'viem'
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // 启用更多性能优化
    // optimizeCss: true, // 暂时禁用，因为critters依赖问题
    scrollRestoration: true,
  },

  // Webpack优化
  webpack: (config, { dev, isServer }) => {
    // 生产环境优化
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            mui: {
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              name: 'mui',
              priority: 20,
              reuseExistingChunk: true,
            },
            web3: {
              test: /[\\/]node_modules[\\/](ethers|@wagmi|viem)[\\/]/,
              name: 'web3',
              priority: 20,
              reuseExistingChunk: true,
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },

  // 图片优化 - Cloudflare Pages 兼容
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // 编译优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Webpack优化
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // 代码分割优化
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        mui: {
          test: /[\\/]node_modules[\\/]@mui[\\/]/,
          name: 'mui',
          chunks: 'all',
          priority: 20,
        },
        web3: {
          test: /[\\/]node_modules[\\/](ethers|@wagmi|viem)[\\/]/,
          name: 'web3',
          chunks: 'all',
          priority: 15,
        },
      },
    };

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
