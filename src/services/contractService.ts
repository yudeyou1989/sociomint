import { ethers, formatEther, formatUnits, parseEther } from 'ethers';
import SMTokenExchangeABI from '../abis/SMTokenExchange.json';
import SMTokenABI from '../abis/SMToken.json';

// BSC测试网合约地址
const EXCHANGE_PROXY_ADDRESS = '0x1B03DD8dCeD4c7D38ABA907671e5e1064D10F8A8'; // 代理合约地址
const EXCHANGE_IMPLEMENTATION_ADDRESS = '0xD23E2E1A55a7E9cC9Cf9CbaA3327F09f1910a1Cb'; // 实现合约地址
const SM_TOKEN_ADDRESS = '0x3273b627510d47CD97Ad6b6DbcFafc6998913643'; // 代币合约地址

// BSC测试网RPC URL
const BSC_TESTNET_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545/';

export interface ExchangeStats {
  totalTokensSold: string;
  totalTokensRemaining: string;
  totalBnbRaised: string;
  currentPrice: string;
  nextRoundPrice: string;
  isActive: boolean;
  currentRound: number;
}

export class ContractService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private smToken: ethers.Contract | null = null;
  private smTokenExchange: ethers.Contract | null = null;

  constructor() {}

  // 获取Exchange合约ABI
  public getExchangeABI() {
    return SMTokenExchangeABI;
  }

  // 获取Token合约ABI
  public getTokenABI() {
    return SMTokenABI;
  }

  public async initialize(provider: ethers.BrowserProvider) {
    this.provider = provider;
    this.signer = await provider.getSigner();

    try {
      // 初始化交易所合约实例
      this.smTokenExchange = new ethers.Contract(
        EXCHANGE_PROXY_ADDRESS,
        SMTokenExchangeABI,
        this.signer
      );

      // 初始化代币合约（直接使用已知地址）
      this.smToken = new ethers.Contract(
        SM_TOKEN_ADDRESS,
        SMTokenABI,
        this.signer
      );

      console.log('合约初始化成功', {
        exchange: EXCHANGE_PROXY_ADDRESS,
        implementation: EXCHANGE_IMPLEMENTATION_ADDRESS,
        token: SM_TOKEN_ADDRESS
      });
    } catch (error) {
      console.error('合约初始化失败', error);
      throw new Error('合约初始化失败');
    }
  }

  // 获取代币余额
  public async getTokenBalance(address: string): Promise<string> {
    if (!this.smToken) throw new Error('合约未初始化');
    try {
      const balance = await this.smToken.balanceOf(address);
      return formatEther(balance);
    } catch (error) {
      console.error('获取代币余额失败', error);
      throw error;
    }
  }

  // 获取BNB余额
  public async getBnbBalance(address: string): Promise<string> {
    if (!this.provider) throw new Error('Provider未初始化');
    try {
      const balance = await this.provider.getBalance(address);
      return formatEther(balance);
    } catch (error) {
      console.error('获取BNB余额失败', error);
      throw error;
    }
  }

  // 获取交易所统计数据
  public async getExchangeStats(): Promise<ExchangeStats> {
    if (!this.smTokenExchange) throw new Error('合约未初始化');
    try {
      const stats = await this.smTokenExchange.getExchangeStats();
      return {
        totalTokensSold: formatEther(stats.totalTokensSold),
        totalTokensRemaining: formatEther(stats.totalTokensRemaining),
        totalBnbRaised: formatEther(stats.totalBnbRaised),
        currentPrice: formatUnits(stats.currentPrice, 'gwei'),
        nextRoundPrice: formatUnits(stats.nextRoundPrice, 'gwei'),
        isActive: stats.isActive,
        currentRound: stats.currentRound
      };
    } catch (error) {
      console.error('获取交易所统计数据失败', error);
      throw error;
    }
  }

  // 购买代币
  public async exchangeTokens(bnbAmount: string): Promise<ethers.ContractTransaction> {
    if (!this.smTokenExchange) throw new Error('合约未初始化');
    try {
      const amountWei = parseEther(bnbAmount);
      return await this.smTokenExchange.exchangeTokens({
        value: amountWei,
        gasLimit: 500000 // 设置适当的gas限制
      });
    } catch (error) {
      console.error('购买代币失败', error);
      throw error;
    }
  }

  // 获取默认provider（用于未连接钱包时读取链上数据）
  public static getReadOnlyProvider(): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  }
}

// 导出单例实例
const contractService = new ContractService();
export default contractService;