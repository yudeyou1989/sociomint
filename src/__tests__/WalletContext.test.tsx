import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { WalletProvider, useWallet } from '../contexts/WalletContext';

// 模拟 window.ethereum
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  isMetaMask: true,
};

// 模拟合约服务
const mockContractService = {
  initialize: jest.fn().mockResolvedValue(undefined),
  getTokenBalance: jest.fn().mockResolvedValue('100.0'),
};

// 模拟 ethers
const mockProvider = {
  send: jest.fn().mockResolvedValue(['0x123456789abcdef123456789abcdef123456789a']),
  getSigner: jest.fn().mockResolvedValue({
    getAddress: jest.fn().mockResolvedValue('0x123456789abcdef123456789abcdef123456789a'),
  }),
  getNetwork: jest.fn().mockResolvedValue({ chainId: 97n }),
  getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
};

jest.mock('ethers', () => ({
  BrowserProvider: jest.fn().mockImplementation(() => mockProvider),
  formatEther: jest.fn().mockImplementation((value) => {
    return (Number(value) / 1e18).toString();
  }),
  parseEther: jest.fn().mockImplementation((value) => {
    return BigInt(Math.floor(parseFloat(value) * 1e18));
  }),
  Contract: jest.fn().mockImplementation(() => ({
    balanceOf: jest.fn().mockResolvedValue(BigInt('100000000000000000000')),
    symbol: jest.fn().mockResolvedValue('SM'),
    decimals: jest.fn().mockResolvedValue(18),
  })),
}));

// 模拟合约服务
jest.mock('../services/contractService', () => ({
  contractService: mockContractService,
}));

// 测试组件
const TestComponent = () => {
  const { wallet, connect, disconnect, isConnecting } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  return (
    <div>
      <div data-testid="connection-status">
        {wallet.isConnected ? 'Connected' : 'Not Connected'}
      </div>
      <div data-testid="address">{wallet.address || ''}</div>
      <div data-testid="chain-id">{wallet.chainId || 0}</div>
      <div data-testid="bnb-balance">{wallet.balance?.bnb || '0'}</div>
      <div data-testid="sm-balance">{wallet.balance?.sm || '0'}</div>
      <div data-testid="connecting-status">
        {isConnecting ? 'Connecting' : 'Not Connecting'}
      </div>
      <button onClick={handleConnect} data-testid="connect-button">
        Connect
      </button>
      <button onClick={handleDisconnect} data-testid="disconnect-button">
        Disconnect
      </button>
    </div>
  );
};

describe('WalletContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 重置 mock ethereum
    mockEthereum.request.mockClear();
    mockEthereum.on.mockClear();
    mockEthereum.removeListener.mockClear();

    // 设置默认成功响应
    mockEthereum.request.mockResolvedValue(['0x123456789abcdef']);

    // 模拟 window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
      configurable: true,
    });
  });

  it('provides initial wallet state', () => {
    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    );

    expect(screen.getByTestId('connection-status')).toHaveTextContent('Not Connected');
    expect(screen.getByTestId('address')).toHaveTextContent('');
    expect(screen.getByTestId('chain-id')).toHaveTextContent('0');
    expect(screen.getByTestId('bnb-balance')).toHaveTextContent('0');
    expect(screen.getByTestId('sm-balance')).toHaveTextContent('0');
    expect(screen.getByTestId('connecting-status')).toHaveTextContent('Not Connecting');
  });

  it('connects wallet successfully', async () => {
    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    );

    const connectButton = screen.getByTestId('connect-button');

    await act(async () => {
      fireEvent.click(connectButton);
    });

    // 检查连接状态
    await waitFor(() => {
      expect(screen.getByTestId('connecting-status')).toHaveTextContent('Connecting');
    });

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      expect(screen.getByTestId('address')).toHaveTextContent('0x123456789abcdef123456789abcdef123456789a');
      expect(screen.getByTestId('chain-id')).toHaveTextContent('97');
    }, { timeout: 3000 });
  });

  it('disconnects wallet', async () => {
    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    );

    // 先连接
    const connectButton = screen.getByTestId('connect-button');
    await act(async () => {
      fireEvent.click(connectButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    }, { timeout: 3000 });

    // 然后断开连接
    const disconnectButton = screen.getByTestId('disconnect-button');
    await act(async () => {
      fireEvent.click(disconnectButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Not Connected');
      expect(screen.getByTestId('address')).toHaveTextContent('');
    });
  });

  it('handles connection error', async () => {
    // 模拟连接错误
    mockEthereum.request.mockRejectedValue(new Error('User rejected'));

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    );

    const connectButton = screen.getByTestId('connect-button');
    await act(async () => {
      fireEvent.click(connectButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Not Connected');
      expect(screen.getByTestId('connecting-status')).toHaveTextContent('Not Connecting');
    }, { timeout: 3000 });
  });

  it('handles missing ethereum provider', async () => {
    // 移除 ethereum 对象
    Object.defineProperty(window, 'ethereum', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    );

    const connectButton = screen.getByTestId('connect-button');
    await act(async () => {
      fireEvent.click(connectButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Not Connected');
    }, { timeout: 3000 });
  });
});
