'use client';

import { ReactNode, useEffect, useState } from 'react';
import { WagmiConfig } from 'wagmi';
import { config } from '@/config/wagmi';

interface WagmiProviderProps {
  children: ReactNode;
}

export function WagmiProvider({ children }: WagmiProviderProps) {
  const [mounted, setMounted] = useState(false);
  
  // 确保挂载后才渲染子组件
  // 这样可以避免客户端与服务器端渲染不匹配的问题
  useEffect(() => setMounted(true), []);

  return <WagmiConfig config={config}>{mounted && children}</WagmiConfig>;
}
