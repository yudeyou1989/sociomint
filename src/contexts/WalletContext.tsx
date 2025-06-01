'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers, formatEther } from 'ethers';
import { WalletType, getConnectedWalletType, disconnectWallet as disconnectWalletService } from '@/services/walletService';
import contractService from '@/services/contractService';
import Logger from '@/services/logger';

// 创建日志记录器
const logger = Logger.createContextLogger({ component: 'WalletContext' });

// 钱包状态接口
export interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  balance?: {
    bnb: string;
    sm?: string;
  };
  network?: {
    id: number;
    name: string;
  };
  account?: {
    address: string;
  };
}

// 可用钱包接口
export interface AvailableWallet {
  type: WalletType;
  name: string;
  icon: string;
  installed: boolean;
}

// 钱包上下文接口
interface WalletContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  updateBalances: () => Promise<void>;
  connectWallet: (type: WalletType) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isConnecting: boolean;
  availableWallets: AvailableWallet[];
}

// 创建上下文，提供默认值
const defaultWalletState: WalletState = {
  isConnected: false,
};

// 默认可用钱包列表
const defaultAvailableWallets: AvailableWallet[] = [
  {
    type: 'metamask',
    name: 'MetaMask',
    icon: '/images/wallets/metamask.svg',
    installed: true
  },
  {
    type: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '/images/wallets/coinbase.svg',
    installed: true
  },
  {
    type: 'walletconnect',
    name: 'WalletConnect',
    icon: '/images/wallets/walletconnect.svg',
    installed: true
  }
];

const WalletContext = createContext<WalletContextType>({
  wallet: defaultWalletState,
  connect: async () => {},
  disconnect: async () => {},
  updateBalances: async () => {},
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  isConnecting: false,
  availableWallets: defaultAvailableWallets,
});

// 钱包提供者Props
interface WalletProviderProps {
  children: ReactNode;
}

// 检查浏览器是否有MetaMask或其他以太坊提供者
const checkIfBrowserHasWallet = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// 获取以太坊提供者
const getEthereumProvider = (): ethers.BrowserProvider => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('没有检测到Ethereum提供者');
  }
  return new ethers.BrowserProvider(window.ethereum as any);
};

// 连接到以太坊钱包
const connectToWallet = async (): Promise<WalletState> => {
  try {
    if (!checkIfBrowserHasWallet()) {
      throw new Error('请安装MetaMask或其他钱包扩展');
    }

    // 请求用户授权连接钱包
    const provider = getEthereumProvider();
    await provider.send('eth_requestAccounts', []);

    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const networkInfo = await provider.getNetwork();
    const chainId = Number(networkInfo.chainId);

    // 初始化合约服务
    await contractService.initialize(provider);

    // 获取余额信息
    const bnbBalance = await provider.getBalance(address);

    let smBalance = '0';
    try {
      smBalance = await contractService.getTokenBalance(address);
    } catch (error) {
      console.warn('获取SM代币余额失败', error);
    }

    const network = {
      id: chainId,
      name: chainId === 56 ? 'BNB Smart Chain' :
           chainId === 97 ? 'BNB Smart Chain Testnet' :
           'Unknown Network'
    };

    return {
      isConnected: true,
      address,
      chainId,
      balance: {
        bnb: formatEther(bnbBalance),
        sm: smBalance
      },
      network,
      account: { address }
    };
  } catch (error) {
    console.error('连接钱包失败:', error);
    throw error;
  }
};

// 钱包提供者组件
export function WalletProvider({ children }: WalletProviderProps) {
  const [wallet, setWallet] = useState<WalletState>(defaultWalletState);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [availableWallets, setAvailableWallets] = useState<AvailableWallet[]>(defaultAvailableWallets);

  // 连接钱包 - 统一的连接函数
  const connect = async (type?: WalletType) => {
    setIsConnecting(true);
    try {
      logger.info(type ? `正在连接 ${type} 钱包...` : '连接钱包...', {
        action: 'connect',
        additionalData: { walletType: type }
      });

      const connectedWallet = await connectToWallet();
      setWallet(connectedWallet);

      logger.info('钱包已连接', {
        action: 'connect',
        additionalData: { address: connectedWallet.address, walletType: type }
      });
    } catch (error) {
      logger.error('连接钱包失败', {
        action: 'connect',
        additionalData: { error, walletType: type }
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // 按类型连接钱包 - 为了保持API兼容性
  const connectWallet = async (type: WalletType) => {
    return connect(type);
  };

  // 断开连接 - 统一的断开连接函数
  const disconnect = async () => {
    try {
      logger.info('断开钱包连接...', {
        action: 'disconnect'
      });

      // 尝试断开WalletConnect连接
      const walletType = getConnectedWalletType();
      if (walletType) {
        await disconnectWalletService(walletType);
      }

      // 重置状态
      setWallet(defaultWalletState);

      logger.info('钱包已断开连接', {
        action: 'disconnect'
      });
    } catch (error) {
      logger.error('断开钱包连接失败', {
        action: 'disconnect',
        additionalData: { error }
      });
    }
  };

  // 断开钱包连接 - 为了保持API兼容性
  const disconnectWallet = async () => {
    return disconnect();
  };

  // 更新余额
  const updateBalances = async () => {
    if (!wallet.isConnected || !wallet.address) return;

    try {
      console.log('更新余额...');

      // 获取真实余额
      const provider = getEthereumProvider();
      const bnbBalance = await provider.getBalance(wallet.address);

      let smBalance = '0';
      try {
        smBalance = await contractService.getTokenBalance(wallet.address);
      } catch (error) {
        console.warn('获取SM代币余额失败', error);
      }

      setWallet(prev => ({
        ...prev,
        balance: {
          bnb: formatEther(bnbBalance),
          sm: smBalance
        }
      }));

      console.log('余额已更新');
    } catch (error) {
      console.error('更新余额失败:', error);
    }
  };

  return (
    <WalletContext.Provider value={{
      wallet,
      connect,
      disconnect,
      updateBalances,
      connectWallet,
      disconnectWallet,
      isConnecting,
      availableWallets
    }}>
      {children}
    </WalletContext.Provider>
  );
}

// 钱包钩子
export function useWallet() {
  return useContext(WalletContext);
}