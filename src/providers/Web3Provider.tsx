'use client';

import { ReactNode, useMemo } from 'react';
import { createConfig, WagmiConfig } from 'wagmi';
import { http } from 'viem';
import { bsc, bscTestnet } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect } from '@wagmi/connectors';

// WalletConnect项目ID
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'fced525820007c9c024132cf432ffcae';

// 创建一个稳定的React Query客户端实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2分钟
      retry: 1, // 减少重试次数
      gcTime: 1000 * 60 * 10, // 10分钟缓存 (注意：cacheTime在新版本中改为gcTime)
    },
  },
});

interface Web3ProviderProps {
  children: ReactNode;
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  // 使用useMemo缓存配置，避免每次渲染重新创建
  const wagmiConfig = useMemo(() => {
    // 定义链
    const chains = [bsc, bscTestnet];

    // 创建Wagmi配置
    return createConfig({
      chains,
      transports: {
        [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_MAINNET_RPC_URL || bsc.rpcUrls.default[0]),
        [bscTestnet.id]: http(process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL || bscTestnet.rpcUrls.default[0]),
      },
      connectors: [
        injected({ chains }),
        walletConnect({
          projectId,
          chains,
          showQrModal: true,
        }),
      ],
    });
  }, []);

  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiConfig>
  );
}
