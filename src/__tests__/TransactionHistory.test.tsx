import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TransactionHistory from '../TransactionHistory';
import { useAccount } from 'wagmi';
import { hasEthereum } from '../services/walletService';
import { ethers } from 'ethers';

// 模拟依赖
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}));

jest.mock('../services/walletService', () => ({
  hasEthereum: jest.fn(),
}));

// 模拟事件数据
const mockEvents = [
  {
    transactionHash: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
    args: {
      bnbAmount: ethers.parseEther('1'),
      tokenAmount: ethers.parseEther('1000'),
      timestamp: 1625097600n, // 2021-07-01
      round: 0n,
      price: ethers.parseEther('0.000001'),
    },
  },
  {
    transactionHash: '0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789abcd',
    args: {
      bnbAmount: ethers.parseEther('2'),
      tokenAmount: ethers.parseEther('2000'),
      timestamp: 1625184000n, // 2021-07-02
      round: 0n,
      price: ethers.parseEther('0.000001'),
    },
  },
];

jest.mock('ethers', () => {
  const original = jest.requireActual('ethers');
  return {
    ...original,
    BrowserProvider: jest.fn().mockImplementation(() => ({
      getSigner: jest.fn().mockResolvedValue({
        getAddress: jest.fn().mockResolvedValue('0x123'),
      }),
    })),
    Contract: jest.fn().mockImplementation(() => ({
      filters: {
        TokensExchanged: jest.fn().mockReturnValue({}),
      },
      queryFilter: jest.fn().mockResolvedValue(mockEvents),
    })),
  };
});

describe('TransactionHistory', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();

    // 默认模拟值
    (useAccount as jest.Mock).mockReturnValue({
      address: '0x123456789abcdef',
      isConnected: true,
    });

    (hasEthereum as jest.Mock).mockReturnValue(true);

    // 模拟window.ethereum
    global.window.ethereum = {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
    };
  });

  it('renders loading state initially', () => {
    render(<TransactionHistory />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders wallet not connected message when not connected', () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: undefined,
      isConnected: false,
    });

    render(<TransactionHistory />);
    expect(screen.getByText('请连接钱包查看您的交易历史')).toBeInTheDocument();
  });

  it('renders error message when there is an error', async () => {
    // 模拟Contract抛出错误
    (ethers.Contract as jest.Mock).mockImplementationOnce(() => {
      throw new Error('获取交易历史失败');
    });

    render(<TransactionHistory />);

    await waitFor(() => {
      expect(screen.getByText('获取交易历史失败，请稍后再试')).toBeInTheDocument();
    });
  });

  it('renders empty state when no transactions', async () => {
    // 模拟没有交易
    (ethers.Contract as jest.Mock).mockImplementationOnce(() => ({
      filters: {
        TokensExchanged: jest.fn().mockReturnValue({}),
      },
      queryFilter: jest.fn().mockResolvedValue([]),
    }));

    render(<TransactionHistory />);

    await waitFor(() => {
      expect(screen.getByText('暂无交易记录')).toBeInTheDocument();
    });
  });

  it('renders transaction history correctly', async () => {
    render(<TransactionHistory />);

    await waitFor(() => {
      // 检查表头
      expect(screen.getByText('交易哈希')).toBeInTheDocument();
      expect(screen.getByText('BNB 数量')).toBeInTheDocument();
      expect(screen.getByText('SM 数量')).toBeInTheDocument();
      expect(screen.getByText('时间')).toBeInTheDocument();
      expect(screen.getByText('轮次')).toBeInTheDocument();
      expect(screen.getByText('价格')).toBeInTheDocument();

      // 检查交易数据
      expect(screen.getByText('0x1234...1234')).toBeInTheDocument();
      expect(screen.getByText('0xabcd...abcd')).toBeInTheDocument();

      // 检查BNB数量
      expect(screen.getByText('1.0000')).toBeInTheDocument();
      expect(screen.getByText('2.0000')).toBeInTheDocument();

      // 检查SM数量
      expect(screen.getByText('1000.00')).toBeInTheDocument();
      expect(screen.getByText('2000.00')).toBeInTheDocument();
    });
  });

  it('respects maxItems prop', async () => {
    // 添加更多模拟事件
    const manyEvents = [
      ...mockEvents,
      {
        transactionHash: '0x111111111111111111111111111111111111111111111111111111111111111',
        args: {
          bnbAmount: ethers.parseEther('3'),
          tokenAmount: ethers.parseEther('3000'),
          timestamp: 1625270400n, // 2021-07-03
          round: 0n,
          price: ethers.parseEther('0.000001'),
        },
      },
    ];

    (ethers.Contract as jest.Mock).mockImplementationOnce(() => ({
      filters: {
        TokensExchanged: jest.fn().mockReturnValue({}),
      },
      queryFilter: jest.fn().mockResolvedValue(manyEvents),
    }));

    // 设置maxItems为2
    render(<TransactionHistory maxItems={2} />);

    await waitFor(() => {
      // 应该只显示2个交易
      const rows = screen.getAllByRole('row');
      // +1是因为表头也算一行
      expect(rows.length).toBe(3);
    });
  });
});
