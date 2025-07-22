/**
 * 全局类型定义
 * 统一管理项目中的TypeScript类型
 */

// 扩展BigInt以支持JSON序列化
declare global {
  interface BigInt {
    toJSON(): string;
  }
  
  // 扩展Window接口以支持以太坊钱包
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
      isConnected?: () => boolean;
      selectedAddress?: string;
      chainId?: string;
    };
  }
}

// 钱包相关类型
export interface WalletBalance {
  bnb: string;
  sm?: string;
  flowers?: string;
}

export interface WalletNetwork {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
}

export interface WalletAccount {
  address: string;
  balance?: WalletBalance;
}

// 代币相关类型
export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  totalSupply?: string;
}

export interface ExchangeRate {
  bnbToSm: string;
  smToBnb: string;
  lastUpdated: number;
}

export interface ExchangeStats {
  currentPrice: string;
  totalSold: string;
  totalRemaining: string;
  currentRound: number;
  nextRoundPrice: string;
  isActive: boolean;
}

// 交易相关类型
export interface Transaction {
  id: string;
  hash: string;
  type: 'purchase' | 'exchange' | 'reward' | 'airdrop' | 'transfer';
  from?: string;
  to?: string;
  amount: string;
  token: string;
  price?: string;
  gasUsed?: string;
  gasPrice?: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  description?: string;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  status: boolean;
  logs: any[];
}

// 用户相关类型
export interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string;
  email?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: number;
  lastLoginAt: number;
  preferences?: {
    language: 'zh' | 'en';
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export interface UserStats {
  totalPurchased: string;
  totalSpent: string;
  averagePrice: string;
  profitLoss: string;
  profitLossPercentage: string;
  transactionCount: number;
  firstPurchaseDate?: number;
}

// 社交任务相关类型
export interface SocialTask {
  id: string;
  type: 'twitter' | 'telegram' | 'discord' | 'custom';
  title: string;
  description: string;
  requirements: {
    action: 'follow' | 'like' | 'retweet' | 'comment' | 'join' | 'share';
    target: string;
    minFollowers?: number;
    hashtags?: string[];
  };
  reward: {
    amount: string;
    token: 'FLOWER' | 'SM';
  };
  isActive: boolean;
  startDate: number;
  endDate?: number;
  maxParticipants?: number;
  currentParticipants: number;
  createdBy: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  userId: string;
  walletAddress: string;
  submissionData: {
    url?: string;
    screenshot?: string;
    proof?: string;
    content?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  rejectReason?: string;
}

// 小红花相关类型
export interface FlowerBalance {
  available: number;
  locked: number;
  earned: number;
  spent: number;
  pending: number;
}

export interface FlowerTransaction {
  id: string;
  type: 'earn' | 'spend' | 'lock' | 'unlock';
  amount: number;
  source: 'task' | 'airdrop' | 'exchange' | 'bonus';
  description: string;
  timestamp: number;
  relatedTaskId?: string;
  relatedTxHash?: string;
}

// 空投相关类型
export interface AirdropPool {
  id: string;
  name: string;
  description: string;
  totalReward: string;
  tokenType: 'SM' | 'FLOWER';
  entryFee: number; // 小红花数量
  maxParticipants: number;
  currentParticipants: number;
  startDate: number;
  endDate: number;
  distributionDate: number;
  isActive: boolean;
  requirements?: {
    minFlowerBalance?: number;
    minSMBalance?: string;
    socialVerification?: boolean;
  };
}

export interface AirdropParticipation {
  id: string;
  poolId: string;
  userId: string;
  walletAddress: string;
  entryAmount: number;
  participatedAt: number;
  reward?: string;
  claimed: boolean;
  claimedAt?: number;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  timestamp?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  stack?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// 基础组件Props类型 - 这些类型已在 components.ts 中定义，这里保留引用
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

// 配置类型
export interface AppConfig {
  network: {
    chainId: number;
    rpcUrl: string;
    blockExplorerUrl: string;
  };
  contracts: {
    smToken: string;
    smTokenExchange: string;
    airdropPool?: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    socialTasks: boolean;
    airdropPools: boolean;
    flowerExchange: boolean;
  };
}

// 扩展全局类型
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }

  // 环境变量类型
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      NEXT_PUBLIC_CHAIN_ID: string;
      NEXT_PUBLIC_RPC_URL: string;
      NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: string;
      NEXT_PUBLIC_SM_TOKEN_ADDRESS: string;
      NEXT_PUBLIC_SM_EXCHANGE_ADDRESS: string;
      NEXT_PUBLIC_MULTISIG_WALLET_ADDRESS: string;
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      CLOUDFLARE_API_TOKEN: string;
      CLOUDFLARE_ACCOUNT_ID: string;
    }
  }
}

export {};
