import { ContractService } from '../services/contractService';

// 模拟 ethers
const mockEthers = {
  BrowserProvider: jest.fn(),
  JsonRpcProvider: jest.fn(),
  Contract: jest.fn(),
  formatEther: jest.fn().mockReturnValue('1.0'),
  formatUnits: jest.fn().mockReturnValue('0.000001'),
  parseEther: jest.fn().mockReturnValue(BigInt('1000000000000000000')),
};

jest.mock('ethers', () => mockEthers);

describe('ContractService', () => {
  let contractService: ContractService;
  let mockProvider: any;
  let mockSigner: any;
  let mockContract: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0x123456789abcdef'),
    };

    mockProvider = {
      getSigner: jest.fn().mockResolvedValue(mockSigner),
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
    };

    mockContract = {
      balanceOf: jest.fn().mockResolvedValue(BigInt('100000000000000000000')),
      getExchangeStats: jest.fn().mockResolvedValue({
        totalTokensSold: BigInt('1000000000000000000000'),
        totalTokensRemaining: BigInt('9000000000000000000000'),
        totalBnbRaised: BigInt('100000000000000000000'),
        currentPrice: BigInt('1000000'),
        nextRoundPrice: BigInt('1100000'),
        isActive: true,
        currentRound: 1,
      }),
      exchangeTokens: jest.fn().mockResolvedValue({
        hash: '0x123456789abcdef',
        wait: jest.fn().mockResolvedValue({ status: 1 }),
      }),
    };

    mockEthers.BrowserProvider.mockImplementation(() => mockProvider);
    mockEthers.Contract.mockImplementation(() => mockContract);

    contractService = new ContractService();
  });

  describe('initialization', () => {
    it('initializes with provider', async () => {
      await contractService.initialize(mockProvider);

      expect(mockProvider.getSigner).toHaveBeenCalled();
      expect(mockEthers.Contract).toHaveBeenCalledTimes(2); // SMToken and SMTokenExchange
    });
  });

  describe('getSMTokenBalance', () => {
    it('returns formatted token balance', async () => {
      await contractService.initialize(mockProvider);

      const balance = await contractService.getSMTokenBalance('0x123');

      expect(mockContract.balanceOf).toHaveBeenCalledWith('0x123');
      expect(mockEthers.formatEther).toHaveBeenCalled();
      expect(balance).toBe('1.0');
    });

    it('throws error when not initialized', async () => {
      await expect(contractService.getSMTokenBalance('0x123')).rejects.toThrow('合约服务未初始化');
    });
  });

  describe('getBNBBalance', () => {
    it('returns formatted BNB balance', async () => {
      await contractService.initialize(mockProvider);

      const balance = await contractService.getBNBBalance('0x123');

      expect(mockProvider.getBalance).toHaveBeenCalledWith('0x123');
      expect(mockEthers.formatEther).toHaveBeenCalled();
      expect(balance).toBe('1.0');
    });

    it('throws error when not initialized', async () => {
      await expect(contractService.getBNBBalance('0x123')).rejects.toThrow('合约服务未初始化');
    });
  });

  describe('getExchangeStats', () => {
    it('returns formatted exchange statistics', async () => {
      await contractService.initialize(mockProvider);

      const stats = await contractService.getExchangeStats();

      expect(mockContract.getExchangeStats).toHaveBeenCalled();
      expect(stats).toEqual({
        totalTokensSold: '1.0',
        totalTokensRemaining: '1.0',
        totalBnbRaised: '1.0',
        currentPrice: '0.000001',
        nextRoundPrice: '0.000001',
        isActive: true,
        currentRound: 1,
      });
    });

    it('throws error when not initialized', async () => {
      await expect(contractService.getExchangeStats()).rejects.toThrow('合约服务未初始化');
    });
  });

  describe('exchangeTokens', () => {
    it('exchanges BNB for tokens successfully', async () => {
      await contractService.initialize(mockProvider);

      const result = await contractService.exchangeTokens('1.0');

      expect(mockEthers.parseEther).toHaveBeenCalledWith('1.0');
      expect(mockContract.exchangeTokens).toHaveBeenCalledWith({
        value: BigInt('1000000000000000000'),
      });
      expect(result.hash).toBe('0x123456789abcdef');
    });

    it('throws error when not initialized', async () => {
      await expect(contractService.exchangeTokens('1.0')).rejects.toThrow('合约服务未初始化');
    });
  });

  describe('getReadOnlyProvider', () => {
    it('returns JsonRpcProvider instance', () => {
      const provider = ContractService.getReadOnlyProvider();

      expect(mockEthers.JsonRpcProvider).toHaveBeenCalledWith('https://data-seed-prebsc-1-s1.binance.org:8545/');
    });
  });
});
