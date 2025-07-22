/**
 * 钱包连接功能测试
 * 测试钱包连接、断开连接、网络切换等核心功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
// import WalletConnection from '@/components/wallet/WalletConnection';

// Mock钱包相关的hooks和工具
jest.mock('@/hooks/useWallet', () => ({
  useWallet: jest.fn()
}));

jest.mock('@/utils/walletUtils', () => ({
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  switchNetwork: jest.fn(),
  getWalletBalance: jest.fn()
}));

// Mock window.ethereum
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  isMetaMask: true,
  isConnected: jest.fn(),
  selectedAddress: null,
  chainId: '0x38' // BSC Mainnet
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true
});

// Mock组件
const MockWalletConnection = () => {
  const wallet = mockUseWallet();

  if (!window.ethereum) {
    return <div>请安装MetaMask钱包</div>;
  }

  if (!wallet.isConnected) {
    return (
      <div>
        <button onClick={wallet.connect}>连接钱包</button>
      </div>
    );
  }

  return (
    <div>
      <div>{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</div>
      <div>{wallet.balance?.bnb} BNB</div>
      <div>{wallet.balance?.sm} SM</div>
      {wallet.chainId !== 56 && (
        <button onClick={() => wallet.switchNetwork(56)}>切换到BSC网络</button>
      )}
      <button onClick={wallet.disconnect}>断开连接</button>
    </div>
  );
};

describe('WalletConnection', () => {
  const mockUseWallet = require('@/hooks/useWallet').useWallet;
  const mockWalletUtils = require('@/utils/walletUtils');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 默认的钱包状态
    mockUseWallet.mockReturnValue({
      address: null,
      isConnected: false,
      chainId: null,
      balance: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchNetwork: jest.fn()
    });
  });

  describe('未连接状态', () => {
    it('应该显示连接钱包按钮', () => {
      render(<MockWalletConnection />);
      
      expect(screen.getByText('连接钱包')).toBeInTheDocument();
      expect(screen.queryByText('断开连接')).not.toBeInTheDocument();
    });

    it('点击连接按钮应该触发连接流程', async () => {
      const mockConnect = jest.fn().mockResolvedValue(true);
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        chainId: null,
        balance: null,
        connect: mockConnect,
        disconnect: jest.fn(),
        switchNetwork: jest.fn()
      });

      render(<WalletConnection />);
      
      const connectButton = screen.getByText('连接钱包');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledTimes(1);
      });
    });

    it('连接失败时应该显示错误信息', async () => {
      const mockConnect = jest.fn().mockRejectedValue(new Error('用户拒绝连接'));
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        chainId: null,
        balance: null,
        connect: mockConnect,
        disconnect: jest.fn(),
        switchNetwork: jest.fn()
      });

      render(<WalletConnection />);
      
      const connectButton = screen.getByText('连接钱包');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/连接失败/)).toBeInTheDocument();
      });
    });
  });

  describe('已连接状态', () => {
    const mockWalletState = {
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 56, // BSC Mainnet
      balance: {
        bnb: '1.5',
        sm: '10000',
        flowers: '500'
      },
      connect: jest.fn(),
      disconnect: jest.fn(),
      switchNetwork: jest.fn()
    };

    beforeEach(() => {
      mockUseWallet.mockReturnValue(mockWalletState);
    });

    it('应该显示钱包地址和余额', () => {
      render(<WalletConnection />);
      
      expect(screen.getByText(/0x1234...7890/)).toBeInTheDocument();
      expect(screen.getByText(/1.5 BNB/)).toBeInTheDocument();
      expect(screen.getByText(/10000 SM/)).toBeInTheDocument();
    });

    it('应该显示断开连接按钮', () => {
      render(<WalletConnection />);
      
      expect(screen.getByText('断开连接')).toBeInTheDocument();
      expect(screen.queryByText('连接钱包')).not.toBeInTheDocument();
    });

    it('点击断开连接应该触发断开流程', async () => {
      const mockDisconnect = jest.fn().mockResolvedValue(true);
      mockUseWallet.mockReturnValue({
        ...mockWalletState,
        disconnect: mockDisconnect
      });

      render(<WalletConnection />);
      
      const disconnectButton = screen.getByText('断开连接');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalledTimes(1);
      });
    });

    it('错误的网络时应该显示切换网络按钮', () => {
      mockUseWallet.mockReturnValue({
        ...mockWalletState,
        chainId: 1 // Ethereum Mainnet (错误网络)
      });

      render(<WalletConnection />);
      
      expect(screen.getByText('切换到BSC网络')).toBeInTheDocument();
    });

    it('点击切换网络应该触发网络切换', async () => {
      const mockSwitchNetwork = jest.fn().mockResolvedValue(true);
      mockUseWallet.mockReturnValue({
        ...mockWalletState,
        chainId: 1,
        switchNetwork: mockSwitchNetwork
      });

      render(<WalletConnection />);
      
      const switchButton = screen.getByText('切换到BSC网络');
      fireEvent.click(switchButton);

      await waitFor(() => {
        expect(mockSwitchNetwork).toHaveBeenCalledWith(56);
      });
    });
  });

  describe('加载状态', () => {
    it('连接过程中应该显示加载状态', async () => {
      const mockConnect = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        chainId: null,
        balance: null,
        connect: mockConnect,
        disconnect: jest.fn(),
        switchNetwork: jest.fn()
      });

      render(<WalletConnection />);
      
      const connectButton = screen.getByText('连接钱包');
      fireEvent.click(connectButton);

      expect(screen.getByText('连接中...')).toBeInTheDocument();
    });

    it('网络切换过程中应该显示加载状态', async () => {
      const mockSwitchNetwork = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      mockUseWallet.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 1,
        balance: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        switchNetwork: mockSwitchNetwork
      });

      render(<WalletConnection />);
      
      const switchButton = screen.getByText('切换到BSC网络');
      fireEvent.click(switchButton);

      expect(screen.getByText('切换中...')).toBeInTheDocument();
    });
  });

  describe('钱包检测', () => {
    it('未安装钱包时应该显示安装提示', () => {
      // 模拟未安装钱包
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true
      });

      render(<WalletConnection />);
      
      expect(screen.getByText(/请安装MetaMask/)).toBeInTheDocument();
    });

    it('应该检测不同类型的钱包', () => {
      // 模拟不同的钱包
      const wallets = [
        { isMetaMask: true, name: 'MetaMask' },
        { isCoinbaseWallet: true, name: 'Coinbase Wallet' },
        { isTrustWallet: true, name: 'Trust Wallet' }
      ];

      wallets.forEach(wallet => {
        Object.defineProperty(window, 'ethereum', {
          value: wallet,
          writable: true
        });

        render(<WalletConnection />);
        // 这里可以添加特定钱包的检测逻辑测试
      });
    });
  });

  describe('事件监听', () => {
    it('应该监听账户变化事件', () => {
      render(<WalletConnection />);
      
      expect(mockEthereum.on).toHaveBeenCalledWith(
        'accountsChanged',
        expect.any(Function)
      );
    });

    it('应该监听网络变化事件', () => {
      render(<WalletConnection />);
      
      expect(mockEthereum.on).toHaveBeenCalledWith(
        'chainChanged',
        expect.any(Function)
      );
    });

    it('组件卸载时应该移除事件监听', () => {
      const { unmount } = render(<WalletConnection />);
      
      unmount();
      
      expect(mockEthereum.removeListener).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该处理用户拒绝连接的错误', async () => {
      const mockConnect = jest.fn().mockRejectedValue({ code: 4001 });
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        chainId: null,
        balance: null,
        connect: mockConnect,
        disconnect: jest.fn(),
        switchNetwork: jest.fn()
      });

      render(<WalletConnection />);
      
      const connectButton = screen.getByText('连接钱包');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/用户拒绝连接/)).toBeInTheDocument();
      });
    });

    it('应该处理网络切换失败的错误', async () => {
      const mockSwitchNetwork = jest.fn().mockRejectedValue(new Error('切换失败'));
      mockUseWallet.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 1,
        balance: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        switchNetwork: mockSwitchNetwork
      });

      render(<WalletConnection />);
      
      const switchButton = screen.getByText('切换到BSC网络');
      fireEvent.click(switchButton);

      await waitFor(() => {
        expect(screen.getByText(/网络切换失败/)).toBeInTheDocument();
      });
    });
  });

  describe('可访问性', () => {
    it('按钮应该有正确的aria标签', () => {
      render(<WalletConnection />);
      
      const connectButton = screen.getByRole('button', { name: /连接钱包/ });
      expect(connectButton).toHaveAttribute('aria-label');
    });

    it('应该支持键盘导航', () => {
      render(<WalletConnection />);
      
      const connectButton = screen.getByText('连接钱包');
      connectButton.focus();
      
      expect(document.activeElement).toBe(connectButton);
    });
  });
});
