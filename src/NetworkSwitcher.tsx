'use client';

import { useState, useEffect } from 'react';
import {
  getUserNetworks,
  getNetworkInfo,
  switchNetwork,
  getCurrentChainId,
  hasEthereum
} from './services/walletService';
import ClientOnly from './ClientOnly';

interface NetworkSwitcherProps {
  onNetworkChange?: (chainId: number) => void;
}

const NetworkSwitcherContent = ({ onNetworkChange }: NetworkSwitcherProps) => {
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const networks = getUserNetworks();

  // 客户端挂载后获取当前链ID
  useEffect(() => {
    const fetchChainId = async () => {
      const chainId = await getCurrentChainId();
      setCurrentChainId(chainId);
    };

    fetchChainId();

    // 设置监听器
    const handleChainChanged = (chainId: number) => {
      setCurrentChainId(chainId);
      if (onNetworkChange) onNetworkChange(chainId);
    };

    // 添加以太坊链切换事件监听器
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('chainChanged', (chainIdHex: string) => {
        const chainId = parseInt(chainIdHex, 16);
        handleChainChanged(chainId);
      });
    }

    return () => {
      // 清理事件监听器
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [onNetworkChange]);

  // 处理网络切换
  const handleNetworkChange = async (chainId: number) => {
    const success = await switchNetwork(chainId);
    if (success) {
      setCurrentChainId(chainId);
      setIsOpen(false);
      if (onNetworkChange) onNetworkChange(chainId);
    }
  };

  // 获取当前网络信息
  const currentNetwork = currentChainId ? getNetworkInfo(currentChainId) : null;

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          {currentNetwork ? (
            <span className="flex items-center">
              <span className={`h-2 w-2 rounded-full mr-2 ${currentNetwork.testnet ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
              {currentNetwork.name}
            </span>
          ) : (
            'Select Network'
          )}
          <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {networks.map((network) => (
              <button
                key={network.chainId}
                className={`flex items-center w-full px-4 py-2 text-sm ${
                  currentChainId === network.chainId ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } hover:bg-gray-100 hover:text-gray-900`}
                role="menuitem"
                onClick={() => handleNetworkChange(network.chainId)}
              >
                <span className={`h-2 w-2 rounded-full mr-2 ${network.testnet ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
                {network.name}
                {network.testnet && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Testnet
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 使用 ClientOnly 组件包装主组件，避免 SSR 错误
const NetworkSwitcher = (props: NetworkSwitcherProps) => (
  <ClientOnly fallback={
    <div className="network-switcher">
      <button className="btn btn-sm">加载网络...</button>
    </div>
  }>
    <NetworkSwitcherContent {...props} />
  </ClientOnly>
);

export default NetworkSwitcher;
