'use client';

/**
 * 统一的钱包服务 - 支持服务器端渲染和客户端使用
 * 整合了simpleWalletService和walletService的功能
 */

import Logger from './logger';

// 动态导入钱包连接库以避免SSR问题
let WalletConnectProvider: any = null;
let EthereumProvider: any = null;

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';

// 动态加载钱包连接库
const loadWalletConnectLibs = async () => {
  if (!isBrowser || WalletConnectProvider) return;

  try {
    const [wcProvider, ethProvider] = await Promise.all([
      import('@walletconnect/web3-provider'),
      import('@walletconnect/ethereum-provider')
    ]);

    WalletConnectProvider = wcProvider.default;
    EthereumProvider = ethProvider.EthereumProvider;
  } catch (error) {
    logger.error('加载WalletConnect库失败:', error);
  }
};

// 创建日志记录器
const logger = Logger.createContextLogger({ component: 'WalletService' });

// 钱包类型
export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'trustwallet' | 'tokenpocket';

// 钱包连接回调接口
export interface WalletCallbacks {
  onConnect?: (address: string, chainId: number) => void;
  onDisconnect?: () => void;
  onAccountsChanged?: (accounts: string[]) => void;
  onChainChanged?: (chainId: number) => void;
}

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

// WalletConnect 提供者单例
let walletConnectProvider: WalletConnectProvider | null = null;
let ethereumProvider: any = null; // 使用any类型暂时避开类型错误

// 安全地访问 window.ethereum
const getEthereum = () => {
  if (isBrowser && typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    return window.ethereum;
  }
  return null;
}

// 检查是否有钱包可用
export const hasEthereum = (): boolean => {
  return getEthereum() !== null;
};

// 检查钱包是否安装
export const isWalletInstalled = (type: WalletType): boolean => {
  try {
    if (!isBrowser) return false;

    switch (type) {
      case 'metamask':
        return Boolean(window.ethereum?.isMetaMask);
      case 'coinbase':
        return Boolean(window.ethereum?.isCoinbaseWallet);
      case 'trustwallet':
        return Boolean(window.ethereum?.isTrust);
      case 'tokenpocket':
        return Boolean(window.ethereum?.isTokenPocket);
      case 'walletconnect':
        return true; // WalletConnect 不需要安装浏览器插件
      default:
        return false;
    }
  } catch (e) {
    logger.warn(`检查钱包安装时出错: ${type}`, {
      action: 'isWalletInstalled',
      additionalData: { error: e, walletType: type }
    });
    return false;
  }
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

// 连接钱包
export const connectWallet = async (): Promise<string | null> => {
  const ethereum = getEthereum();
  if (!ethereum) return null;

  try {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0] || null;
  } catch (error) {
    logger.error('连接钱包时出错', {
      action: 'connectWallet',
      additionalData: { error }
    });
    return null;
  }
};

// 获取当前账户
export const getCurrentAccount = async (): Promise<string | null> => {
  const ethereum = getEthereum();
  if (!ethereum) return null;

  try {
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    return accounts[0] || null;
  } catch (error) {
    logger.error('获取账户时出错', {
      action: 'getCurrentAccount',
      additionalData: { error }
    });
    return null;
  }
};

// 获取当前链ID
export const getCurrentChainId = async (): Promise<number | null> => {
  const ethereum = getEthereum();
  if (!ethereum) return null;

  try {
    const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
    return chainIdHex ? parseInt(chainIdHex, 16) : null;
  } catch (error) {
    logger.error('获取链ID时出错', {
      action: 'getCurrentChainId',
      additionalData: { error }
    });
    return null;
  }
};

// 切换网络
export const switchNetwork = async (chainId: number): Promise<boolean> => {
  const ethereum = getEthereum();
  if (!ethereum) return false;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }]
    });
    return true;
  } catch (error) {
    logger.warn('切换网络时出错', {
      action: 'switchNetwork',
      additionalData: { error, chainId }
    });

    // 如果网络不存在，尝试添加
    const network = getNetworkInfo(chainId);
    if (network) {
      try {
        await ethereum.request({
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
        logger.error('添加网络时出错', {
          action: 'addNetwork',
          additionalData: { error: addError, chainId, network }
        });
        return false;
      }
    }
    return false;
  }
};

// 设置账户变化监听器
export const setupAccountChangeListener = (callback: (accounts: string[]) => void): (() => void) | null => {
  const ethereum = getEthereum();
  if (!ethereum) return null;

  const handleAccountsChanged = (accounts: string[]) => {
    callback(accounts);
  };

  ethereum.on('accountsChanged', handleAccountsChanged);

  // 返回清理函数
  return () => {
    ethereum.removeListener('accountsChanged', handleAccountsChanged);
  };
};

// 连接浏览器插件钱包
export async function connectBrowserWallet(type: 'metamask' | 'coinbase' | 'trustwallet' | 'tokenpocket', callbacks?: WalletCallbacks): Promise<{ address: string; chainId: number } | null> {
  try {
    if (!isWalletInstalled(type)) {
      const walletNames = {
        metamask: 'MetaMask',
        coinbase: 'Coinbase Wallet',
        trustwallet: 'Trust Wallet',
        tokenpocket: 'TokenPocket'
      };

      throw new Error(`${walletNames[type]}钱包未安装`);
    }

    // 确保ethereum存在
    if (!window.ethereum) {
      throw new Error('无法访问以太坊提供者');
    }

    // 安全地获取ethereum引用
    const provider = window.ethereum;

    // 请求账户授权
    const accounts = await provider.request({ method: 'eth_requestAccounts' });

    if (!accounts || accounts.length === 0) {
      throw new Error('未能获取钱包账户');
    }

    const address = accounts[0];

    // 获取链ID
    const chainIdHex = await provider.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex as string, 16);

    // 设置事件监听
    provider.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        callbacks?.onDisconnect?.();
      } else {
        callbacks?.onAccountsChanged?.(accounts);
      }
    });

    provider.on('chainChanged', (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      callbacks?.onChainChanged?.(newChainId);
    });

    provider.on('disconnect', () => {
      callbacks?.onDisconnect?.();
    });

    // 触发连接回调
    callbacks?.onConnect?.(address, chainId);

    return { address, chainId };
  } catch (error) {
    logger.error(`连接${type}钱包失败`, {
      action: 'connectBrowserWallet',
      additionalData: { error, walletType: type }
    });
    return null;
  }
}

// 连接 MetaMask
export async function connectMetamask(callbacks?: WalletCallbacks): Promise<{ address: string; chainId: number } | null> {
  return connectBrowserWallet('metamask', callbacks);
}

// 连接 Coinbase Wallet
export async function connectCoinbase(callbacks?: WalletCallbacks): Promise<{ address: string; chainId: number } | null> {
  return connectBrowserWallet('coinbase', callbacks);
}

// 连接 Trust Wallet
export async function connectTrustWallet(callbacks?: WalletCallbacks): Promise<{ address: string; chainId: number } | null> {
  return connectBrowserWallet('trustwallet', callbacks);
}

// 连接 TokenPocket
export async function connectTokenPocket(callbacks?: WalletCallbacks): Promise<{ address: string; chainId: number } | null> {
  return connectBrowserWallet('tokenpocket', callbacks);
}

// 连接 WalletConnect (使用最新版本)
export async function connectWalletConnectV2(callbacks?: WalletCallbacks): Promise<{ address: string; chainId: number } | null> {
  try {
    // 项目ID从环境变量获取
    const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    if (!projectId) {
      console.error('WalletConnect项目ID未配置，请检查环境变量 NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');
      throw new Error('未配置WalletConnect项目ID');
    }

    // 如果已有连接，先断开
    if (ethereumProvider) {
      await ethereumProvider.disconnect();
      ethereumProvider = null;
    }

    // 创建新的EthereumProvider
    ethereumProvider = await EthereumProvider.init({
      projectId,
      showQrModal: true,
      chains: [56], // BSC Mainnet
      optionalChains: [1, 97], // Ethereum Mainnet, BSC Testnet
      methods: [
        'eth_sendTransaction',
        'eth_sign',
        'personal_sign',
        'eth_signTypedData',
      ],
      events: [
        'chainChanged',
        'accountsChanged',
      ],
      qrModalOptions: {
        themeMode: 'dark',
        themeVariables: {
          '--wcm-z-index': '99999999', // 确保QR码模态框在最上层
          '--wcm-font-family': '"Inter", system-ui, sans-serif',
          '--wcm-background-color': '#1a1a1a',
          '--wcm-accent-color': '#0de5ff',
          '--wcm-text-color': '#ffffff',
          '--wcm-border-radius-master': '12px',
        },
        explorerRecommendedWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
        ],
        mobileWallets: [
          {
            id: 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
            name: 'MetaMask',
            links: {
              native: 'metamask://',
              universal: 'https://metamask.app.link'
            }
          },
          {
            id: 'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
            name: 'Coinbase Wallet',
            links: {
              native: 'cbwallet://',
              universal: 'https://go.cb-w.com'
            }
          }
        ],
        desktopWallets: [
          {
            id: 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
            name: 'MetaMask',
            links: {
              native: 'metamask://',
              universal: 'https://metamask.io'
            }
          }
        ]
      }
    });

    // 注册事件监听器
    ethereumProvider.on('connect', (info: { chainId: number }) => {
      ethereumProvider?.getAccounts().then((accounts: string[]) => {
        if (callbacks?.onConnect && accounts.length > 0) {
          callbacks.onConnect(accounts[0], info.chainId);
        }
      });
    });

    ethereumProvider.on('disconnect', () => {
      if (callbacks?.onDisconnect) {
        callbacks.onDisconnect();
      }
    });

    ethereumProvider.on('accountsChanged', (accounts: string[]) => {
      if (callbacks?.onAccountsChanged) {
        callbacks.onAccountsChanged(accounts);
      }
    });

    ethereumProvider.on('chainChanged', (chainId: number) => {
      if (callbacks?.onChainChanged) {
        callbacks.onChainChanged(chainId);
      }
    });

    // 请求连接
    await ethereumProvider.enable();
    const accounts = await ethereumProvider.getAccounts();

    if (accounts && accounts.length > 0) {
      return {
        address: accounts[0],
        chainId: ethereumProvider.chainId
      };
    }

    return null;
  } catch (error) {
    logger.error('WalletConnect 连接失败', {
      action: 'connectWalletConnectV2',
      additionalData: { error }
    });
    return null;
  }
}

// 连接 WalletConnect
export async function connectWalletConnect(callbacks?: WalletCallbacks): Promise<{ address: string; chainId: number } | null> {
  try {
    // 尝试使用新版连接
    if (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
      return connectWalletConnectV2(callbacks);
    }

    // 如果没有项目ID，回退到旧版
    // 如果已有连接，先断开
    if (walletConnectProvider) {
      await walletConnectProvider.disconnect();
      walletConnectProvider = null;
    }

    // 创建新的 WalletConnect 提供者
    walletConnectProvider = new WalletConnectProvider({
      rpc: {
        1: process.env.NEXT_PUBLIC_ETH_RPC_URL || 'https://mainnet.infura.io/v3/',
        56: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
        97: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545'
      },
      chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '56', 10),
      qrcode: true,
      qrcodeModalOptions: {
        mobileLinks: ['metamask', 'trust', 'coinbase', 'tokenpocket'],
        desktopLinks: ['metamask', 'trust', 'coinbase', 'tokenpocket'],
      }
    });

    // 注册事件监听器
    walletConnectProvider.on('connect', (info: { accounts: string[]; chainId: number }) => {
      if (callbacks?.onConnect && info.accounts.length > 0) {
        callbacks.onConnect(info.accounts[0], info.chainId);
      }
    });

    walletConnectProvider.on('disconnect', () => {
      if (callbacks?.onDisconnect) {
        callbacks.onDisconnect();
      }
    });

    walletConnectProvider.on('accountsChanged', (accounts: string[]) => {
      if (callbacks?.onAccountsChanged) {
        callbacks.onAccountsChanged(accounts);
      }
    });

    walletConnectProvider.on('chainChanged', (chainId: number) => {
      if (callbacks?.onChainChanged) {
        callbacks.onChainChanged(chainId);
      }
    });

    // 请求连接
    const accounts = await walletConnectProvider.enable();

    if (accounts && accounts.length > 0) {
      return {
        address: accounts[0],
        chainId: walletConnectProvider.chainId
      };
    }

    return null;
  } catch (error) {
    logger.error('WalletConnect 连接失败', {
      action: 'connectWalletConnect',
      additionalData: { error }
    });
    return null;
  }
}

// 连接指定类型的钱包
export async function connectWalletByType(type: WalletType, callbacks?: WalletCallbacks): Promise<{ address: string; chainId: number } | null> {
  switch(type) {
    case 'metamask':
      return connectMetamask(callbacks);
    case 'coinbase':
      return connectCoinbase(callbacks);
    case 'trustwallet':
      return connectTrustWallet(callbacks);
    case 'tokenpocket':
      return connectTokenPocket(callbacks);
    case 'walletconnect':
      return connectWalletConnect(callbacks);
    default:
      throw new Error(`不支持的钱包类型: ${type}`);
  }
}

// 获取当前连接的钱包类型
export function getConnectedWalletType(): WalletType | null {
  if (!isBrowser) return null;

  if (ethereumProvider?.connected || walletConnectProvider?.connected) {
    return 'walletconnect';
  }

  if (!window.ethereum) return null;

  if (window.ethereum.isMetaMask) return 'metamask';
  if (window.ethereum.isCoinbaseWallet) return 'coinbase';
  if (window.ethereum.isTrust) return 'trustwallet';
  if (window.ethereum.isTokenPocket) return 'tokenpocket';

  return null;
}

// 断开钱包连接
export async function disconnectWallet(walletType?: WalletType): Promise<void> {
  if (walletType === 'walletconnect' || !walletType) {
    try {
      if (ethereumProvider) {
        await ethereumProvider.disconnect();
        ethereumProvider = null;
      } else if (walletConnectProvider) {
        await walletConnectProvider.disconnect();
        walletConnectProvider = null;
      }
    } catch (error) {
      logger.error('断开 WalletConnect 失败', {
        action: 'disconnectWallet',
        additionalData: { error }
      });
    }
  }

  // 对于浏览器插件钱包，我们可以清除本地存储
  if (isBrowser) {
    localStorage.removeItem('walletconnect');
  }
}

// 扩展window对象类型
declare global {
  interface Window {
    ethereum?: {
      request: (args: any) => Promise<any>;
      on: (event: string, callback: any) => void;
      removeListener: (event: string, callback: any) => void;
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      isTrust?: boolean;
      isTokenPocket?: boolean;
    };
  }
}
