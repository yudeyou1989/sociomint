import { defineChain } from 'viem';
import { bsc, bscTestnet } from 'viem/chains';
import SMTokenAbi from '../abis/SMToken.json';
import SMTokenExchangeAbi from '../abis/SMTokenExchange.json';

// 从环境变量读取配置
const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '97');

// 支持的链
export const supportedChains = [
  bsc,
  bscTestnet,
  // 可以根据需要添加更多链
];

// 从环境变量获取 RPC URLs
const getRpcUrl = (chainId: number): string | undefined => {
  switch (chainId) {
    case 56: // BSC Mainnet
      return process.env.NEXT_PUBLIC_BSC_MAINNET_RPC_URL;
    case 97: // BSC Testnet
      return process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL;
    default:
      return undefined;
  }
};

// 合约地址配置
export const contractAddresses = {
  smToken: process.env.NEXT_PUBLIC_SM_TOKEN_ADDRESS as `0x${string}` | undefined,
  smTokenExchange: process.env.NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS as `0x${string}` | undefined,
};

// 为 viem 配置链
export const configureChains = () => {
  const customizedChains = supportedChains.map(chain => {
    const rpcUrl = getRpcUrl(chain.id);
    if (rpcUrl) {
      return defineChain({
        ...chain,
        rpcUrls: {
          ...chain.rpcUrls,
          default: {
            http: [rpcUrl],
          },
          public: {
            http: [rpcUrl],
          },
        },
      });
    }
    return chain;
  });

  return customizedChains;
};

// 获取默认链
export const getDefaultChain = () => {
  return supportedChains.find(chain => chain.id === DEFAULT_CHAIN_ID) || bscTestnet;
};

// 合约 ABI
export const contractAbis = {
  smToken: SMTokenAbi,
  smTokenExchange: SMTokenExchangeAbi,
};

// ExchangeStats 类型定义
export interface ExchangeStats {
  totalTokensSold: bigint;
  totalTokensRemaining: bigint;
  totalBnbRaised: bigint;
  currentPrice: bigint;
  nextRoundPrice: bigint;
  isActive: boolean;
  currentRound: number;
}

export default {
  supportedChains,
  contractAddresses,
  contractAbis,
  getDefaultChain,
  configureChains,
}; 