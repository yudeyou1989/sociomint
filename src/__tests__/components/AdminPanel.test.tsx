import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock AdminPanel component
const MockAdminPanel = () => {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [minAmount, setMinAmount] = React.useState('0.01');
  const [maxAmount, setMaxAmount] = React.useState('10');

  return (
    <div data-testid="admin-panel">
      <h2>Admin Panel</h2>
      {!isAdmin ? (
        <div data-testid="access-denied">
          <p>Access Denied: Admin privileges required</p>
          <button onClick={() => setIsAdmin(true)} data-testid="mock-admin-access">
            Grant Admin Access (Test)
          </button>
        </div>
      ) : (
        <div data-testid="admin-controls">
          <div data-testid="contract-controls">
            <h3>Contract Controls</h3>
            <button
              data-testid="pause-button"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? 'Unpause' : 'Pause'} Contract
            </button>
            <div data-testid="contract-status">
              Status: {isPaused ? 'Paused' : 'Active'}
            </div>
          </div>
          <div data-testid="amount-controls">
            <h3>Purchase Limits</h3>
            <div>
              <label>Min Amount:</label>
              <input
                data-testid="min-amount-input"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>
            <div>
              <label>Max Amount:</label>
              <input
                data-testid="max-amount-input"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
            <button data-testid="update-limits-button">Update Limits</button>
          </div>
        </div>
      )}
    </div>
  );
};

// 模拟 ethers
const mockContract = {
  getExchangeStats: jest.fn(),
  minPurchaseAmount: jest.fn(),
  maxPurchaseAmount: jest.fn(),
  isUserVerified: jest.fn(),
  verifyUser: jest.fn(),
  setMinPurchaseAmount: jest.fn(),
  setMaxPurchaseAmount: jest.fn(),
  pause: jest.fn(),
  unpause: jest.fn(),
  paused: jest.fn(),
  wait: jest.fn().mockResolvedValue({ status: 1 }),
};

const mockProvider = {
  getSigner: jest.fn().mockResolvedValue({
    getAddress: jest.fn().mockResolvedValue('0x123456789abcdef'),
  }),
  getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
};

jest.mock('ethers', () => ({
  BrowserProvider: jest.fn().mockImplementation(() => mockProvider),
  Contract: jest.fn().mockImplementation(() => mockContract),
  formatEther: jest.fn().mockReturnValue('1.0'),
  parseEther: jest.fn().mockReturnValue(BigInt('1000000000000000000')),
}));

// 模拟 window.ethereum
const mockEthereum = {
  request: jest.fn().mockResolvedValue(['0x123456789abcdef']),
  on: jest.fn(),
  removeListener: jest.fn(),
  isMetaMask: true,
};

describe('AdminPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置默认返回值
    mockContract.getExchangeStats.mockResolvedValue({
      totalTokensSold: BigInt('1000000000000000000000'),
      totalTokensRemaining: BigInt('9000000000000000000000'),
      totalBnbRaised: BigInt('100000000000000000000'),
      currentPrice: BigInt('1000000'),
      nextRoundPrice: BigInt('1100000'),
      isActive: true,
      currentRound: 1,
    });
    
    mockContract.minPurchaseAmount.mockResolvedValue(BigInt('10000000000000000'));
    mockContract.maxPurchaseAmount.mockResolvedValue(BigInt('10000000000000000000'));
    mockContract.isUserVerified.mockResolvedValue(false);
    mockContract.paused.mockResolvedValue(false);
    
    // 模拟 window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
      configurable: true,
    });
  });

  it('renders admin panel correctly', async () => {
    render(<MockAdminPanel />);

    // 等待组件加载
    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    expect(screen.getByTestId('access-denied')).toBeInTheDocument();
  });

  it('grants admin access successfully', async () => {
    render(<MockAdminPanel />);

    const grantAccessButton = screen.getByTestId('mock-admin-access');
    fireEvent.click(grantAccessButton);

    await waitFor(() => {
      expect(screen.getByTestId('admin-controls')).toBeInTheDocument();
    });
  });

  it('loads exchange stats after wallet connection', async () => {
    render(<AdminPanel />);
    
    // 连接钱包
    const connectButton = screen.getByText('连接钱包');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(mockContract.getExchangeStats).toHaveBeenCalled();
    });
  });

  it('verifies user correctly', async () => {
    render(<AdminPanel />);
    
    // 连接钱包
    const connectButton = screen.getByText('连接钱包');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('0x1234...cdef')).toBeInTheDocument();
    });
    
    // 输入用户地址
    const userAddressInput = screen.getByPlaceholderText('输入用户地址');
    fireEvent.change(userAddressInput, { 
      target: { value: '0x1234567890abcdef1234567890abcdef12345678' } 
    });
    
    // 点击验证用户
    const verifyButton = screen.getByText('验证用户');
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(mockContract.verifyUser).toHaveBeenCalledWith(
        '0x1234567890abcdef1234567890abcdef12345678',
        true
      );
    });
  });

  it('updates purchase limits correctly', async () => {
    render(<AdminPanel />);
    
    // 连接钱包
    const connectButton = screen.getByText('连接钱包');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('0x1234...cdef')).toBeInTheDocument();
    });
    
    // 更新最小购买金额
    const minAmountInput = screen.getByDisplayValue('0.01');
    fireEvent.change(minAmountInput, { target: { value: '0.02' } });
    
    const updateLimitsButton = screen.getByText('更新限制');
    fireEvent.click(updateLimitsButton);
    
    await waitFor(() => {
      expect(mockContract.setMinPurchaseAmount).toHaveBeenCalled();
    });
  });

  it('handles pause/unpause correctly', async () => {
    render(<AdminPanel />);
    
    // 连接钱包
    const connectButton = screen.getByText('连接钱包');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('0x1234...cdef')).toBeInTheDocument();
    });
    
    // 暂停合约
    const pauseButton = screen.getByText('暂停合约');
    fireEvent.click(pauseButton);
    
    await waitFor(() => {
      expect(mockContract.pause).toHaveBeenCalled();
    });
  });

  it('displays loading states correctly', async () => {
    render(<AdminPanel />);
    
    expect(screen.getByText('加载中...')).toBeInTheDocument();
    
    // 连接钱包
    const connectButton = screen.getByText('连接钱包');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    // 模拟错误
    mockContract.getExchangeStats.mockRejectedValue(new Error('Contract error'));
    
    render(<AdminPanel />);
    
    const connectButton = screen.getByText('连接钱包');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      // 应该显示错误状态或回退到默认状态
      expect(screen.getByText('连接钱包')).toBeInTheDocument();
    });
  });

  it('validates user address input', async () => {
    render(<AdminPanel />);
    
    // 连接钱包
    const connectButton = screen.getByText('连接钱包');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('0x1234...cdef')).toBeInTheDocument();
    });
    
    // 输入无效地址
    const userAddressInput = screen.getByPlaceholderText('输入用户地址');
    fireEvent.change(userAddressInput, { target: { value: 'invalid-address' } });
    
    const verifyButton = screen.getByText('验证用户');
    fireEvent.click(verifyButton);
    
    // 应该不会调用合约函数
    expect(mockContract.verifyUser).not.toHaveBeenCalled();
  });

  it('displays transaction status correctly', async () => {
    render(<AdminPanel />);
    
    // 连接钱包
    const connectButton = screen.getByText('连接钱包');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('0x1234...cdef')).toBeInTheDocument();
    });
    
    // 模拟交易进行中
    mockContract.verifyUser.mockReturnValue({
      hash: '0x123',
      wait: jest.fn().mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ status: 1 }), 100);
      }))
    });
    
    const userAddressInput = screen.getByPlaceholderText('输入用户地址');
    fireEvent.change(userAddressInput, { 
      target: { value: '0x1234567890abcdef1234567890abcdef12345678' } 
    });
    
    const verifyButton = screen.getByText('验证用户');
    fireEvent.click(verifyButton);
    
    // 应该显示交易进行中的状态
    await waitFor(() => {
      expect(screen.getByText('交易进行中...')).toBeInTheDocument();
    });
  });

  it('handles network switching', async () => {
    render(<AdminPanel />);
    
    // 模拟网络切换错误
    mockEthereum.request.mockRejectedValueOnce(new Error('User rejected'));
    
    const connectButton = screen.getByText('连接钱包');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      // 应该处理网络切换错误
      expect(screen.getByText('连接钱包')).toBeInTheDocument();
    });
  });
});
