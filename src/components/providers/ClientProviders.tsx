'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// 动态导入Web3相关组件以避免SSR问题
const Web3Provider = dynamic(() => import('@/providers/Web3Provider'), { ssr: false });
const BlockchainMonitorProvider = dynamic(() => import('@/providers/BlockchainMonitorProvider'), { ssr: false });
const WalletProvider = dynamic(() => import('@/contexts/WalletContext').then(mod => ({ default: mod.WalletProvider })), { ssr: false });
const WalletConnectFixLite = dynamic(() => import('@/components/wallet/WalletConnectFixLite'), { ssr: false });
const WalletConnectDebug = dynamic(() => import('@/components/wallet/WalletConnectDebug'), { ssr: false });

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <Web3Provider>
      <BlockchainMonitorProvider>
        <WalletProvider>
          {children}
          <WalletConnectFixLite />
          {process.env.NODE_ENV === 'development' && <WalletConnectDebug />}
        </WalletProvider>
      </BlockchainMonitorProvider>
    </Web3Provider>
  );
}
