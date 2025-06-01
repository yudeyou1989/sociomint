'use client';

import React from 'react';
import { createConfig, WagmiConfig } from 'wagmi';
import { http } from 'viem';
import { injected, walletConnect } from '@wagmi/connectors';
import { bsc, bscTestnet } from '@/config/wagmi';

// 定义链
const chains = [bsc, bscTestnet];

// WalletConnect项目ID
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'fced525820007c9c024132cf432ffcae';

// 创建Wagmi配置
const config = createConfig({
  chains,
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
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

// Wagmi提供者组件
export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return <WagmiConfig config={config}>{children}</WagmiConfig>;
}
