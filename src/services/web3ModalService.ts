'use client';

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { bsc, bscTestnet } from 'viem/chains';
import { QueryClient } from '@tanstack/react-query';

// 获取环境变量
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '56');

if (!projectId) {
  throw new Error('需要设置环境变量NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');
}

// 配置支持的链
export const chains = [bsc, bscTestnet];
export const defaultChain = chainId === 56 ? bsc : bscTestnet;

// 创建查询客户端
const queryClient = new QueryClient();

// 创建 Wagmi 配置
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId: projectId as string,
  queryClient,
  metadata: {
    name: 'SocioMint',
    description: '社交媒体与区块链结合的创新应用',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://sociomint.app',
    icons: [typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png'],
  },
});

// 创建 Web3Modal 实例
export function initWeb3Modal() {
  return createWeb3Modal({
    wagmiConfig,
    projectId: projectId as string,
    chains,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent-color': '#0de5ff',
      '--w3m-background-color': '#000000',
      '--w3m-text-color': '#ffffff',
      '--w3m-font-family': 'Inter, system-ui, sans-serif',
      '--w3m-border-radius-master': '12px',
    },
    enableAnalytics: false,
    featuredWalletIds: [],
    defaultChain,
  });
}

// 初始化Web3Modal（用于客户端组件）
export let web3Modal: ReturnType<typeof createWeb3Modal>;

// 在客户端环境下初始化
if (typeof window !== 'undefined') {
  web3Modal = initWeb3Modal();
} 