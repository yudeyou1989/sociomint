'use client';

import React, { useState, useEffect } from 'react';
import ClientOnly from '../ClientOnly';
import { FaGlobe, FaChevronDown, FaCheck } from 'react-icons/fa';
import { useWallet } from '@/contexts/WalletContext';
import { 
  switchNetwork, 
  getUserNetworks, 
  getNetworkInfo,
  NetworkInfo
} from '@/services/walletService';

// 网络切换器组件内容
function NetworkSwitcherContent({ onChainChange }: { onChainChange?: (chainId: number) => void }) {
  const { wallet } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);

  // 获取支持的网络列表
  useEffect(() => {
    const supportedNetworks = getUserNetworks();
    setNetworks(supportedNetworks);
  }, []);

  // 获取当前网络信息
  const getCurrentNetwork = () => {
    if (!wallet.isConnected || !wallet.chainId) {
      return null;
    }
    return getNetworkInfo(wallet.chainId);
  };

  // 处理网络切换
  const handleNetworkChange = async (chainId: number) => {
    if (isChanging || !wallet.isConnected) return;

    setIsChanging(true);

    try {
      const success = await switchNetwork(chainId);
      if (success) {
        if (onChainChange) onChainChange(chainId);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('切换网络失败:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2 py-1 rounded-md border ${isChanging ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'} transition-colors duration-200 ease-in-out`}
        disabled={isChanging || !wallet.isConnected}
      >
        <FaGlobe className="text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium">
          {getCurrentNetwork()?.name || '选择网络'}
        </span>
        <FaChevronDown className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              支持的网络
            </div>

            {networks.map(network => (
              <button
                key={network.chainId}
                onClick={() => handleNetworkChange(network.chainId)}
                className={`w-full text-left block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${wallet.chainId === network.chainId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span>{network.name}</span>
                  {wallet.chainId === network.chainId && (
                    <FaCheck className="text-green-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 使用 ClientOnly 组件包装主组件，避免 SSR 错误
export default function NetworkSwitcher(props: { onChainChange?: (chainId: number) => void }) {
  return (
    <ClientOnly fallback={<div className="network-switcher">加载网络...</div>}>
      <NetworkSwitcherContent {...props} />
    </ClientOnly>
  );
}
