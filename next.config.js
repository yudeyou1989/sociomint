/** @type {import('next').NextConfig} */
const nextConfig = {
  // 配置 webpack 以避免在服务器端渲染时尝试使用浏览器 API
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 在服务器端将所有浏览器相关模块替换为空模块
      config.resolve.alias = {
        ...config.resolve.alias,
        '@walletconnect/ethereum-provider': false,
        '@walletconnect/universal-provider': false,
        '@walletconnect/web3-provider': false,
        'walletconnect': false,
        'web3modal': false
      };
    }
    return config;
  },

  // 确保静态资源处理正确
  images: {
    unoptimized: true,
  },

  // 设置全局环境变量
  env: {
    NEXT_PUBLIC_SM_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_SM_TOKEN_ADDRESS || "0xd7d7dd989642222B6f685aF0220dc0065F489ae0",
    NEXT_PUBLIC_SM_EXCHANGE_ADDRESS: process.env.NEXT_PUBLIC_SM_EXCHANGE_ADDRESS || "0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E",
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "fced525820007c9c024132cf432ffcae"
  },

  // 确保所有页面以客户端组件方式渲染
  reactStrictMode: true,

  // 允许跨域资源
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },

  // 注意：不要使用 exportPathMap 配置，因为它与 app 目录不兼容
  // 改用 generateStaticParams
}

module.exports = nextConfig
