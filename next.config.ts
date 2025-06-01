import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  eslint: {
    // 在生产构建期间忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在生产构建期间忽略TypeScript错误
    ignoreBuildErrors: true,
  },
  // 恢复静态导出模式
  output: 'export',
  // 配置静态资源
  images: {
    unoptimized: true,
  },
  // 指定要导出的页面
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/': { page: '/' },
      '/assets': { page: '/assets' },
      '/tasks': { page: '/tasks' },
      '/profile': { page: '/profile' },
      '/404': { page: '/404' },
    };
  },
  // 跳过预渲染错误
  onDemandEntries: {
    // 在开发模式下，页面保持编译状态的时间（毫秒）
    maxInactiveAge: 25 * 1000,
    // 同时保持编译状态的页面数
    pagesBufferLength: 2,
  },
};

export default nextConfig;
