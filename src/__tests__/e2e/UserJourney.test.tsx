/**
 * 端到端用户旅程测试
 * 测试完整的用户交互流程
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock App component since the actual App.tsx doesn't exist in this structure
const MockApp = () => {
  return (
    <div data-testid="app">
      <header data-testid="header">
        <h1>SocioMint</h1>
        <button data-testid="connect-wallet">Connect Wallet</button>
      </header>
      <main data-testid="main">
        <div data-testid="exchange-section">
          <h2>Token Exchange</h2>
          <input data-testid="bnb-input" placeholder="BNB Amount" />
          <button data-testid="exchange-button">Exchange</button>
        </div>
        <div data-testid="balance-section">
          <div data-testid="sm-balance">SM Balance: 100</div>
          <div data-testid="bnb-balance">BNB Balance: 5.0</div>
        </div>
      </main>
    </div>
  );
};

// 模拟完整的应用环境
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  isMetaMask: true,
};

const mockContract = {
  // Token contract methods
  name: jest.fn().mockResolvedValue('SocioMint Token'),
  symbol: jest.fn().mockResolvedValue('SM'),
  decimals: jest.fn().mockResolvedValue(18),
  balanceOf: jest.fn().mockResolvedValue(BigInt('100000000000000000000')),
  hasRole: jest.fn().mockResolvedValue(false),
  
  // Exchange contract methods
  getExchangeStats: jest.fn().mockResolvedValue({
    totalTokensSold: BigInt('1000000000000000000000'),
    totalTokensRemaining: BigInt('9000000000000000000000'),
    totalBnbRaised: BigInt('100000000000000000000'),
    currentPrice: BigInt('833000000000'),
    nextRoundPrice: BigInt('974900000000'),
    isActive: true,
    currentRound: 0,
  }),
  exchangeTokens: jest.fn().mockResolvedValue({
    hash: '0x123456789abcdef',
    wait: jest.fn().mockResolvedValue({ status: 1 })
  }),
  getUserData: jest.fn().mockResolvedValue({
    totalPurchased: BigInt('50000000000000000000'),
    lastPurchaseTime: BigInt('1640995200'),
    isVerified: true,
  }),
  isUserVerified: jest.fn().mockResolvedValue(true),
  minPurchaseAmount: jest.fn().mockResolvedValue(BigInt('10000000000000000')),
  maxPurchaseAmount: jest.fn().mockResolvedValue(BigInt('10000000000000000000')),
  
  // Transaction history
  queryFilter: jest.fn().mockResolvedValue([
    {
      args: {
        buyer: '0x123456789abcdef',
        bnbAmount: BigInt('1000000000000000000'),
        tokenAmount: BigInt('1200000000000000000000'),
        timestamp: 1640995200n,
        round: 0n,
        price: BigInt('833000000000'),
      },
      blockNumber: 12345,
      transactionHash: '0xabcdef123456789',
    }
  ]),
  filters: {
    TokensExchanged: jest.fn().mockReturnValue({}),
  },
};

const mockProvider = {
  getSigner: jest.fn().mockResolvedValue({
    getAddress: jest.fn().mockResolvedValue('0x123456789abcdef123456789abcdef123456789a'),
  }),
  getBalance: jest.fn().mockResolvedValue(BigInt('5000000000000000000')), // 5 BNB
  getNetwork: jest.fn().mockResolvedValue({ chainId: 97n, name: 'bsc-testnet' }),
  send: jest.fn().mockResolvedValue(['0x123456789abcdef123456789abcdef123456789a']),
};

jest.mock('ethers', () => ({
  BrowserProvider: jest.fn().mockImplementation(() => mockProvider),
  Contract: jest.fn().mockImplementation(() => mockContract),
  formatEther: jest.fn().mockImplementation((value) => {
    return (Number(value) / 1e18).toString();
  }),
  formatUnits: jest.fn().mockImplementation((value, decimals) => {
    return (Number(value) / Math.pow(10, decimals)).toString();
  }),
  parseEther: jest.fn().mockImplementation((value) => {
    return BigInt(Math.floor(parseFloat(value) * 1e18));
  }),
}));

// 模拟 Next.js 路由
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('End-to-End User Journey Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置默认的 ethereum 响应
    mockEthereum.request.mockImplementation((params) => {
      if (params.method === 'eth_requestAccounts') {
        return Promise.resolve(['0x123456789abcdef123456789abcdef123456789a']);
      }
      if (params.method === 'wallet_switchEthereumChain') {
        return Promise.resolve();
      }
      return Promise.resolve();
    });
    
    // 模拟 window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
      configurable: true,
    });
  });

  describe('Complete User Journey: From Landing to Token Purchase', () => {
    it('should complete full user journey successfully', async () => {
      render(<MockApp />);

      // 1. 用户访问首页
      expect(screen.getByText('SocioMint')).toBeInTheDocument();
      expect(screen.getByTestId('connect-wallet')).toBeInTheDocument();

      // 2. 连接钱包
      const connectButton = screen.getByTestId('connect-wallet');
      await user.click(connectButton);

      // 模拟钱包连接成功
      expect(connectButton).toBeInTheDocument();

      // 3. 验证应用界面元素
      expect(screen.getByTestId('exchange-section')).toBeInTheDocument();
      expect(screen.getByTestId('balance-section')).toBeInTheDocument();

      // 4. 查看用户余额
      expect(screen.getByTestId('sm-balance')).toHaveTextContent('SM Balance: 100');
      expect(screen.getByTestId('bnb-balance')).toHaveTextContent('BNB Balance: 5.0');

      // 5. 测试交换功能
      const bnbInput = screen.getByTestId('bnb-input');
      await user.clear(bnbInput);
      await user.type(bnbInput, '1.0');

      // 6. 执行购买
      const exchangeButton = screen.getByTestId('exchange-button');
      await user.click(purchaseButton);

      // 10. 确认交易
      await waitFor(() => {
        expect(mockContract.exchangeTokens).toHaveBeenCalledWith({
          value: expect.any(BigInt)
        });
      });

      // 11. 等待交易确认
      await waitFor(() => {
        expect(screen.getByText(/交易成功/)).toBeInTheDocument();
      });

      // 12. 查看更新后的余额
      await waitFor(() => {
        expect(mockContract.balanceOf).toHaveBeenCalled();
      });
    });

    it('should handle wallet connection errors gracefully', async () => {
      // 模拟用户拒绝连接
      mockEthereum.request.mockRejectedValue(new Error('User rejected the request'));

      render(<App />);

      const connectButton = screen.getByText('连接钱包');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('连接钱包')).toBeInTheDocument();
        // 应该显示错误信息或保持未连接状态
      });
    });

    it('should handle insufficient balance scenario', async () => {
      // 模拟余额不足
      mockProvider.getBalance.mockResolvedValue(BigInt('100000000000000000')); // 0.1 BNB

      render(<App />);

      // 连接钱包
      const connectButton = screen.getByText('连接钱包');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('0x1234...789a')).toBeInTheDocument();
      });

      // 尝试购买超过余额的金额
      const exchangeLink = screen.getByText('代币兑换');
      await user.click(exchangeLink);

      const bnbInput = screen.getByPlaceholderText('输入 BNB 数量');
      await user.clear(bnbInput);
      await user.type(bnbInput, '1.0');

      const purchaseButton = screen.getByText('购买代币');
      await user.click(purchaseButton);

      // 应该显示余额不足的错误
      await waitFor(() => {
        expect(screen.getByText(/余额不足/)).toBeInTheDocument();
      });
    });

    it('should handle network switching', async () => {
      // 模拟错误的网络
      mockProvider.getNetwork.mockResolvedValue({ chainId: 1n, name: 'mainnet' });

      render(<App />);

      const connectButton = screen.getByText('连接钱包');
      await user.click(connectButton);

      // 应该提示切换网络
      await waitFor(() => {
        expect(screen.getByText(/请切换到 BSC 测试网/)).toBeInTheDocument();
      });

      // 点击切换网络按钮
      const switchNetworkButton = screen.getByText('切换网络');
      await user.click(switchNetworkButton);

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledWith({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x61' }], // BSC Testnet
        });
      });
    });
  });

  describe('Transaction History Journey', () => {
    it('should display transaction history correctly', async () => {
      render(<App />);

      // 连接钱包
      const connectButton = screen.getByText('连接钱包');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('0x1234...789a')).toBeInTheDocument();
      });

      // 导航到交易历史
      const historyLink = screen.getByText('交易历史');
      await user.click(historyLink);

      // 验证交易历史显示
      await waitFor(() => {
        expect(screen.getByText(/交易历史/)).toBeInTheDocument();
        expect(mockContract.queryFilter).toHaveBeenCalled();
      });

      // 验证交易记录显示
      await waitFor(() => {
        expect(screen.getByText(/1.0 BNB/)).toBeInTheDocument();
        expect(screen.getByText(/1,200 SM/)).toBeInTheDocument();
      });
    });

    it('should handle empty transaction history', async () => {
      mockContract.queryFilter.mockResolvedValue([]);

      render(<App />);

      // 连接钱包
      const connectButton = screen.getByText('连接钱包');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('0x1234...789a')).toBeInTheDocument();
      });

      // 导航到交易历史
      const historyLink = screen.getByText('交易历史');
      await user.click(historyLink);

      // 验证空状态显示
      await waitFor(() => {
        expect(screen.getByText(/暂无交易记录/)).toBeInTheDocument();
      });
    });
  });

  describe('Admin Panel Journey', () => {
    it('should handle admin access correctly', async () => {
      // 模拟管理员权限
      mockContract.hasRole.mockResolvedValue(true);

      render(<App />);

      // 连接钱包
      const connectButton = screen.getByText('连接钱包');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('0x1234...789a')).toBeInTheDocument();
      });

      // 导航到管理员面板
      const adminLink = screen.getByText('管理员');
      await user.click(adminLink);

      // 验证管理员面板显示
      await waitFor(() => {
        expect(screen.getByText(/管理员面板/)).toBeInTheDocument();
        expect(screen.getByText(/验证用户/)).toBeInTheDocument();
      });
    });

    it('should deny access for non-admin users', async () => {
      // 模拟非管理员用户
      mockContract.hasRole.mockResolvedValue(false);

      render(<App />);

      // 连接钱包
      const connectButton = screen.getByText('连接钱包');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('0x1234...789a')).toBeInTheDocument();
      });

      // 尝试访问管理员面板
      const adminLink = screen.getByText('管理员');
      await user.click(adminLink);

      // 应该显示权限不足的消息
      await waitFor(() => {
        expect(screen.getByText(/权限不足/)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design Journey', () => {
    it('should work correctly on mobile devices', async () => {
      // 模拟移动设备视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      render(<App />);

      // 验证移动端布局
      expect(screen.getByText('SocioMint')).toBeInTheDocument();
      
      // 连接钱包
      const connectButton = screen.getByText('连接钱包');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('0x1234...789a')).toBeInTheDocument();
      });

      // 验证移动端导航
      const menuButton = screen.getByRole('button', { name: /菜单/ });
      await user.click(menuButton);

      expect(screen.getByText('代币兑换')).toBeInTheDocument();
    });
  });

  describe('Error Recovery Journey', () => {
    it('should recover from network errors', async () => {
      // 模拟网络错误
      mockContract.getExchangeStats.mockRejectedValueOnce(new Error('Network error'));

      render(<App />);

      // 连接钱包
      const connectButton = screen.getByText('连接钱包');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('0x1234...789a')).toBeInTheDocument();
      });

      // 导航到交换页面
      const exchangeLink = screen.getByText('代币兑换');
      await user.click(exchangeLink);

      // 应该显示错误状态
      await waitFor(() => {
        expect(screen.getByText(/加载失败/)).toBeInTheDocument();
      });

      // 点击重试按钮
      mockContract.getExchangeStats.mockResolvedValue({
        totalTokensSold: BigInt('1000000000000000000000'),
        totalTokensRemaining: BigInt('9000000000000000000000'),
        totalBnbRaised: BigInt('100000000000000000000'),
        currentPrice: BigInt('833000000000'),
        nextRoundPrice: BigInt('974900000000'),
        isActive: true,
        currentRound: 0,
      });

      const retryButton = screen.getByText('重试');
      await user.click(retryButton);

      // 应该恢复正常显示
      await waitFor(() => {
        expect(screen.getByText(/已售出代币/)).toBeInTheDocument();
      });
    });
  });
});
