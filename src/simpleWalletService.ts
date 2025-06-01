'use client';

import { Chain } from 'wagmi/chains';
import { switchChain } from 'wagmi/actions';

// 网络定义
export interface NetworkInfo {
  chainId: number;
  name: string;
  currency: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  testnet: boolean;
}

// 支持的网络
const NETWORKS: NetworkInfo[] = [
  {
    chainId: 56,
    name: 'BSC',
    currency: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    blockExplorerUrl: 'https://bscscan.com',
    testnet: false
  },
  {
    chainId: 97,
    name: 'BSC Testnet',
    currency: 'tBNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    blockExplorerUrl: 'https://testnet.bscscan.com',
    testnet: true
  }
];

// 检查是否在浏览器环境
export const isBrowser = () => typeof window !== 'undefined';

// 检查是否有钱包可用
export const hasEthereum = (): boolean => {
  return isBrowser() && typeof window.ethereum !== 'undefined';
};

// 获取所有支持的网络
export const getUserNetworks = (): NetworkInfo[] => {
  return NETWORKS;
};

// 根据链ID获取网络信息
export const getNetworkInfo = (chainId: number): NetworkInfo | null => {
  const network = NETWORKS.find(net => net.chainId === chainId);
  return network || null;
};

// 创建Wagmi链对象
export const createChainConfig = (chainId: number): Chain | null => {
  const network = getNetworkInfo(chainId);
  
  if (!network) return null;
  
  return {
    id: network.chainId,
    name: network.name,
    nativeCurrency: {
      name: network.currency,
      symbol: network.currency,
      decimals: 18
    },
    rpcUrls: {
      default: { http: [network.rpcUrl] },
      public: { http: [network.rpcUrl] },
    },
    blockExplorers: {
      default: { name: network.name + ' Explorer', url: network.blockExplorerUrl },
    },
    testnet: network.testnet
  } as Chain;
};

// 连接钱包
export const connectWallet = async (): Promise<string | null> => {
  // 仅在浏览器环境执行
  if (!hasEthereum()) return null;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0] || null;
  } catch (error) {
    console.error('连接钱包时出错:', error);
    return null;
  }
};

// 获取当前账户
export const getCurrentAccount = async (): Promise<string | null> => {
  // 仅在浏览器环境执行
  if (!hasEthereum()) return null;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts[0] || null;
  } catch (error) {
    console.error('获取账户时出错:', error);
    return null;
  }
};

// 获取当前链ID
export const getCurrentChainId = async (): Promise<number | null> => {
  // 仅在浏览器环境执行
  if (!hasEthereum()) return null;
  
  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    return chainIdHex ? parseInt(chainIdHex, 16) : null;
  } catch (error) {
    console.error('获取链ID时出错:', error);
    return null;
  }
};

// 切换网络
export const switchNetwork = async (chainId: number): Promise<boolean> => {
  // 仅在浏览器环境执行
  if (!hasEthereum()) return false;
  
  try {
    // 不使用 wagmi 的 switchChain，而是直接使用 ethereum API
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }]
    });
    return true;
  } catch (error) {
    console.error('切换网络时出错:', error);
    
    // 如果网络不存在，尝试添加
    const network = getNetworkInfo(chainId);
    if (network) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${chainId.toString(16)}`,
            chainName: network.name,
            nativeCurrency: {
              name: network.currency,
              symbol: network.currency,
              decimals: 18
            },
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.blockExplorerUrl]
          }]
        });
        return true;
      } catch (addError) {
        console.error('添加网络时出错:', addError);
        return false;
      }
    }
    return false;
  }
};

// 设置账户变化监听器
export const setupAccountChangeListener = (callback: (accounts: string[]) => void): (() => void) | null => {
  // 仅在浏览器环境执行
  if (!hasEthereum()) return null;
  
  const handleAccountsChanged = (accounts: string[]) => {
    callback(accounts);
  };
  
  window.ethereum.on('accountsChanged', handleAccountsChanged);
  
  // 返回清理函数
  return () => {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
  };
};
