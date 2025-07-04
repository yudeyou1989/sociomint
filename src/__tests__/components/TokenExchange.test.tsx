import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock TokenExchange component
const MockTokenExchange = () => {
  const [bnbAmount, setBnbAmount] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleExchange = async () => {
    setLoading(true);
    // Simulate exchange
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div data-testid="token-exchange">
      <h2>Token Exchange</h2>
      <div data-testid="exchange-stats">
        <div>Current Price: 0.000833 BNB</div>
        <div>Tokens Sold: 1,000</div>
        <div>Tokens Remaining: 9,000</div>
      </div>
      <div data-testid="exchange-form">
        <input
          data-testid="bnb-input"
          type="number"
          placeholder="Enter BNB amount"
          value={bnbAmount}
          onChange={(e) => setBnbAmount(e.target.value)}
        />
        <button
          data-testid="exchange-button"
          onClick={handleExchange}
          disabled={loading || !bnbAmount}
        >
          {loading ? 'Exchanging...' : 'Exchange Tokens'}
        </button>
      </div>
      <div data-testid="user-balance">
        <div>BNB Balance: 5.0</div>
        <div>SM Balance: 100</div>
      </div>
    </div>
  );
};

// Mock WalletProvider
const MockWalletProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="wallet-provider">{children}</div>;
};

// 模拟 ethers
const mockContract = {
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
  minPurchaseAmount: jest.fn().mockResolvedValue(BigInt('10000000000000000')),
  maxPurchaseAmount: jest.fn().mockResolvedValue(BigInt('10000000000000000000')),
};

const mockProvider = {
  getSigner: jest.fn().mockResolvedValue({
    getAddress: jest.fn().mockResolvedValue('0x123456789abcdef'),
  }),
  getBalance: jest.fn().mockResolvedValue(BigInt('5000000000000000000')),
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

// 模拟 WalletContext
const mockWalletContext = {
  wallet: {
    isConnected: true,
    address: '0x123456789abcdef123456789abcdef123456789a',
    chainId: 97,
    balance: {
      bnb: '5.0',
      sm: '100.0'
    }
  },
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  isConnecting: false,
};

jest.mock('../../contexts/WalletContext', () => ({
  useWallet: () => mockWalletContext,
  WalletProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MockWalletProvider>
    {children}
  </MockWalletProvider>
);

describe('TokenExchange Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders exchange interface correctly', async () => {
    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Token Exchange')).toBeInTheDocument();
      expect(screen.getByTestId('exchange-form')).toBeInTheDocument();
    });
  });

  it('displays exchange statistics', async () => {
    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/已售出代币/)).toBeInTheDocument();
      expect(screen.getByText(/剩余代币/)).toBeInTheDocument();
      expect(screen.getByText(/当前价格/)).toBeInTheDocument();
    });
  });

  it('handles BNB input correctly', async () => {
    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    const bnbInput = screen.getByPlaceholderText('输入 BNB 数量');
    
    await user.clear(bnbInput);
    await user.type(bnbInput, '1.0');

    expect(bnbInput).toHaveValue('1.0');
  });

  it('calculates token amount correctly', async () => {
    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/当前价格/)).toBeInTheDocument();
    });

    const bnbInput = screen.getByPlaceholderText('输入 BNB 数量');
    
    await user.clear(bnbInput);
    await user.type(bnbInput, '1.0');

    await waitFor(() => {
      expect(screen.getByText(/您将获得/)).toBeInTheDocument();
    });
  });

  it('validates minimum purchase amount', async () => {
    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    const bnbInput = screen.getByPlaceholderText('输入 BNB 数量');
    
    await user.clear(bnbInput);
    await user.type(bnbInput, '0.005'); // 低于最小金额

    const purchaseButton = screen.getByText('购买代币');
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(screen.getByText(/购买金额不能低于最小限制/)).toBeInTheDocument();
    });
  });

  it('validates maximum purchase amount', async () => {
    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    const bnbInput = screen.getByPlaceholderText('输入 BNB 数量');
    
    await user.clear(bnbInput);
    await user.type(bnbInput, '15.0'); // 高于最大金额

    const purchaseButton = screen.getByText('购买代币');
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(screen.getByText(/购买金额不能超过最大限制/)).toBeInTheDocument();
    });
  });

  it('validates sufficient balance', async () => {
    // 模拟余额不足
    mockProvider.getBalance.mockResolvedValue(BigInt('100000000000000000')); // 0.1 BNB

    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    const bnbInput = screen.getByPlaceholderText('输入 BNB 数量');
    
    await user.clear(bnbInput);
    await user.type(bnbInput, '1.0');

    const purchaseButton = screen.getByText('购买代币');
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(screen.getByText(/余额不足/)).toBeInTheDocument();
    });
  });

  it('executes token purchase successfully', async () => {
    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/当前价格/)).toBeInTheDocument();
    });

    const bnbInput = screen.getByPlaceholderText('输入 BNB 数量');
    
    await user.clear(bnbInput);
    await user.type(bnbInput, '1.0');

    const purchaseButton = screen.getByText('购买代币');
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(mockContract.exchangeTokens).toHaveBeenCalledWith({
        value: expect.any(BigInt)
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/交易成功/)).toBeInTheDocument();
    });
  });

  it('handles transaction failure', async () => {
    mockContract.exchangeTokens.mockRejectedValue(new Error('Transaction failed'));

    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/当前价格/)).toBeInTheDocument();
    });

    const bnbInput = screen.getByPlaceholderText('输入 BNB 数量');
    
    await user.clear(bnbInput);
    await user.type(bnbInput, '1.0');

    const purchaseButton = screen.getByText('购买代币');
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(screen.getByText(/交易失败/)).toBeInTheDocument();
    });
  });

  it('displays loading state during transaction', async () => {
    // 模拟慢交易
    const slowWait = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ status: 1 }), 1000))
    );
    
    mockContract.exchangeTokens.mockResolvedValue({
      hash: '0x123456789abcdef',
      wait: slowWait
    });

    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/当前价格/)).toBeInTheDocument();
    });

    const bnbInput = screen.getByPlaceholderText('输入 BNB 数量');
    
    await user.clear(bnbInput);
    await user.type(bnbInput, '1.0');

    const purchaseButton = screen.getByText('购买代币');
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(screen.getByText(/交易进行中/)).toBeInTheDocument();
    });
  });

  it('updates exchange stats after successful purchase', async () => {
    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/当前价格/)).toBeInTheDocument();
    });

    const bnbInput = screen.getByPlaceholderText('输入 BNB 数量');
    
    await user.clear(bnbInput);
    await user.type(bnbInput, '1.0');

    const purchaseButton = screen.getByText('购买代币');
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(screen.getByText(/交易成功/)).toBeInTheDocument();
    });

    // 应该重新获取统计信息
    await waitFor(() => {
      expect(mockContract.getExchangeStats).toHaveBeenCalledTimes(2);
    });
  });

  it('handles exchange inactive state', async () => {
    mockContract.getExchangeStats.mockResolvedValue({
      totalTokensSold: BigInt('1000000000000000000000'),
      totalTokensRemaining: BigInt('9000000000000000000000'),
      totalBnbRaised: BigInt('100000000000000000000'),
      currentPrice: BigInt('833000000000'),
      nextRoundPrice: BigInt('974900000000'),
      isActive: false, // 交换未激活
      currentRound: 0,
    });

    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/代币兑换暂未开放/)).toBeInTheDocument();
    });

    const purchaseButton = screen.getByText('购买代币');
    expect(purchaseButton).toBeDisabled();
  });

  it('displays correct price formatting', async () => {
    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/0\.000000000833/)).toBeInTheDocument();
    });
  });

  it('handles wallet not connected state', async () => {
    // 模拟钱包未连接
    const disconnectedWalletContext = {
      ...mockWalletContext,
      wallet: {
        ...mockWalletContext.wallet,
        isConnected: false,
        address: '',
      }
    };

    (require('../../contexts/WalletContext').useWallet as jest.Mock).mockReturnValue(disconnectedWalletContext);

    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    expect(screen.getByText('请先连接钱包')).toBeInTheDocument();
    
    const purchaseButton = screen.getByText('购买代币');
    expect(purchaseButton).toBeDisabled();
  });

  it('handles network error gracefully', async () => {
    mockContract.getExchangeStats.mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/加载失败/)).toBeInTheDocument();
    });

    const retryButton = screen.getByText('重试');
    expect(retryButton).toBeInTheDocument();
  });

  it('retries loading on network error', async () => {
    mockContract.getExchangeStats
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({
        totalTokensSold: BigInt('1000000000000000000000'),
        totalTokensRemaining: BigInt('9000000000000000000000'),
        totalBnbRaised: BigInt('100000000000000000000'),
        currentPrice: BigInt('833000000000'),
        nextRoundPrice: BigInt('974900000000'),
        isActive: true,
        currentRound: 0,
      });

    render(
      <TestWrapper>
        <MockTokenExchange />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/加载失败/)).toBeInTheDocument();
    });

    const retryButton = screen.getByText('重试');
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/当前价格/)).toBeInTheDocument();
    });
  });
});
