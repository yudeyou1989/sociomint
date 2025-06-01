// 区块链配置
export const chainConfig = {
  // BNB Smart Chain 主网配置
  mainnet: {
    id: 56,
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    currency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    explorer: {
      url: 'https://bscscan.com',
      apiUrl: 'https://api.bscscan.com/api'
    }
  },
  // BNB Smart Chain 测试网配置
  testnet: {
    id: 97,
    name: 'BNB Smart Chain Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    currency: {
      name: 'tBNB',
      symbol: 'tBNB',
      decimals: 18
    },
    explorer: {
      url: 'https://testnet.bscscan.com',
      apiUrl: 'https://api-testnet.bscscan.com/api'
    }
  },
  // 当前使用的网络 (可根据环境变量切换)
  current: process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
  
  // 预售合约地址
  contracts: {
    // 测试网合约地址
    testnet: {
      presale: '0x123456789abcdef123456789abcdef123456789a', // 预售合约（测试网）
      token: '0xabcdef123456789abcdef123456789abcdef1234'    // 代币合约（测试网）
    },
    // 主网合约地址
    mainnet: {
      presale: '0x987654321abcdef987654321abcdef987654321a', // 预售合约（主网）
      token: '0xfedcba987654321fedcba987654321fedcba9876'    // 代币合约（主网）
    }
  }
}; 