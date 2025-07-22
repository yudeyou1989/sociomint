/**
 * Next.js 图片优化配置
 * 配置图片压缩、格式转换和缓存策略
 */

const imageConfig = {
  // 图片域名配置
  domains: [
    'localhost',
    'sociomint.top',
    'images.unsplash.com',
    'via.placeholder.com',
    'cdn.jsdelivr.net',
    'raw.githubusercontent.com'
  ],
  
  // 远程图片模式配置
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'via.placeholder.com',
      port: '',
      pathname: '/**',
    }
  ],
  
  // 支持的图片格式
  formats: ['image/webp', 'image/avif'],
  
  // 图片尺寸配置
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  
  // 图片质量配置
  quality: 75,
  
  // 最小缓存时间 (秒)
  minimumCacheTTL: 60 * 60 * 24 * 7, // 7天
  
  // 禁用静态导入优化 (因为使用export模式)
  unoptimized: process.env.NODE_ENV === 'production',
  
  // 加载器配置
  loader: process.env.NODE_ENV === 'production' ? 'custom' : 'default',
  loaderFile: process.env.NODE_ENV === 'production' ? './image-loader.js' : undefined,
};

module.exports = imageConfig;
