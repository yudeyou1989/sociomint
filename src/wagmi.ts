'use client';

import { createConfig } from 'wagmi';
import { bsc, bscTestnet } from 'viem/chains';
import { http } from 'viem';
import { injected, metaMask, walletConnect } from '@wagmi/connectors';

// WalletConnect项目ID
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'fced525820007c9c024132cf432ffcae';

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';

// 创建Wagmi配置 - 注意：在服务器端我们使用最小配置，客户端使用完整配置
const config = createConfig({
  chains: [bsc, bscTestnet] as const,
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  // 仅在客户端环境添加钱包连接器
  connectors: isBrowser ? [
    metaMask(),
    injected(),
    walletConnect({ projectId })
  ] : [],
  // 不配置自定义存储，让wagmi使用默认配置
  ssr: true,
});

// 导出支持的链
export { config, bsc, bscTestnet };
