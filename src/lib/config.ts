/**
 * 项目配置文件
 * 统一管理所有配置信息
 */

// 网络配置
export const NETWORKS = {
  BSC_TESTNET: {
    chainId: 97,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    blockExplorerUrl: 'https://testnet.bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
  },
  BSC_MAINNET: {
    chainId: 56,
    name: 'BSC Mainnet',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    blockExplorerUrl: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
  },
};

// 智能合约地址
export const CONTRACTS = {
  // 测试网地址 (实际部署)
  TESTNET: {
    SM_TOKEN: '0xd7d7dd989642222B6f685aF0220dc0065F489ae0',
    SM_EXCHANGE: '0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E',
    MULTISIG_WALLET: '0x681E8E1921778A450930Bc1991c93981FD0B1F24',
  },
  // 主网地址 (待部署)
  MAINNET: {
    SM_TOKEN: '',
    SM_EXCHANGE: '',
    MULTISIG_WALLET: '',
  }
};

// 当前环境配置
export const getCurrentNetwork = () => {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97');
  return chainId === 56 ? NETWORKS.BSC_MAINNET : NETWORKS.BSC_TESTNET;
};

export const getCurrentContracts = () => {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97');
  return chainId === 56 ? CONTRACTS.MAINNET : CONTRACTS.TESTNET;
};

// API配置
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// 钱包配置
export const WALLET_CONFIG = {
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
  supportedChains: [NETWORKS.BSC_TESTNET.chainId, NETWORKS.BSC_MAINNET.chainId],
  defaultChain: getCurrentNetwork().chainId,
};

// 社交平台配置
export const SOCIAL_CONFIG = {
  discord: {
    clientId: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sociomint.top'}/api/auth/discord/callback`,
  },
  twitter: {
    // 注意：您提供的是Access Token，不是OAuth Client ID
    // 需要从Twitter开发者控制台获取OAuth 2.0 Client ID
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '',
  },
};

// 数据库配置
export const DATABASE_CONFIG = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
};

// 应用配置
export const APP_CONFIG = {
  name: 'SocioMint',
  version: '1.0.0',
  description: 'Social Media meets Blockchain',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://sociomint.top',
  supportEmail: 'support@sociomint.top',
  
  // 功能开关
  features: {
    socialTasks: true,
    airdropPools: true,
    flowerExchange: true,
    multiLanguage: true,
  },
  
  // 限制配置
  limits: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxTasksPerUser: 10,
    maxAirdropParticipation: 5,
  },
};

// 监控配置
export const MONITORING_CONFIG = {
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  },
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
  },
};

// 部署配置
export const DEPLOYMENT_CONFIG = {
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    projectName: 'sociomint',
  },
  domain: 'sociomint.top',
  environment: process.env.NODE_ENV || 'development',
};

// 安全配置
export const SECURITY_CONFIG = {
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: '7d',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 100,
  },
  cors: {
    origin: [
      'https://sociomint.top',
      'https://www.sociomint.top',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
    ],
  },
};

// 代币配置
export const TOKEN_CONFIG = {
  SM: {
    name: 'SocioMint',
    symbol: 'SM',
    decimals: 18,
    initialPrice: '0.000000833', // BNB
    priceIncrement: '0.0000001419', // BNB per round
  },
  FLOWER: {
    name: 'Red Flower',
    symbol: 'FLOWER',
    decimals: 0, // 整数
    exchangeRate: 0.01, // 1 FLOWER = 0.01 SM
  },
};

// 导出默认配置
export default {
  networks: NETWORKS,
  contracts: CONTRACTS,
  api: API_CONFIG,
  wallet: WALLET_CONFIG,
  social: SOCIAL_CONFIG,
  database: DATABASE_CONFIG,
  app: APP_CONFIG,
  monitoring: MONITORING_CONFIG,
  deployment: DEPLOYMENT_CONFIG,
  security: SECURITY_CONFIG,
  token: TOKEN_CONFIG,
  
  // 便捷方法
  getCurrentNetwork,
  getCurrentContracts,
  
  // 环境检查
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTestnet: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97') === 97,
  isMainnet: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97') === 56,
};
