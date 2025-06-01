import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import UserBalanceDisplay from '../UserBalanceDisplay';
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
      symbol: jest.fn().mockResolvedValue('SM'),
      decimals: jest.fn().mockResolvedValue(18),
      balanceOf: jest.fn().mockResolvedValue(ethers.parseEther('1000')),
      userData: jest.fn().mockResolvedValue([
        ethers.parseEther('5'),
        1234567890n,
      ]),
      isUserVerified: jest.fn().mockResolvedValue(true),
    })),
  };
});

describe('UserBalanceDisplay', () => {
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
    render(<UserBalanceDisplay />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders wallet not connected message when not connected', () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: undefined,
      isConnected: false,
    });

    render(<UserBalanceDisplay />);
    expect(screen.getByText('请连接钱包查看您的余额')).toBeInTheDocument();
  });

  it('renders error message when there is an error', async () => {
    // 模拟Contract抛出错误
    (ethers.Contract as jest.Mock).mockImplementationOnce(() => {
      throw new Error('获取用户数据失败');
    });

    render(<UserBalanceDisplay />);

    await waitFor(() => {
      expect(screen.getByText('获取用户数据失败，请稍后再试')).toBeInTheDocument();
    });
  });

  it('renders user balance data correctly', async () => {
    render(<UserBalanceDisplay />);

    await waitFor(() => {
      // 检查钱包地址
      expect(screen.getByText('0x1234...cdef')).toBeInTheDocument();

      // 检查代币余额
      expect(screen.getByText('1,000 SM')).toBeInTheDocument();

      // 检查总购买金额
      expect(screen.getByText('5 BNB')).toBeInTheDocument();

      // 检查验证状态
      expect(screen.getByText('已验证')).toBeInTheDocument();
    });
  });

  it('handles ethereum not available', () => {
    (hasEthereum as jest.Mock).mockReturnValue(false);

    render(<UserBalanceDisplay />);

    expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
  });
});
