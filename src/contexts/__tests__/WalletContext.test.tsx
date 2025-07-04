/**
 * WalletContext测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    BrowserProvider: jest.fn(),
    formatEther: jest.fn((value) => '1.0'),
    parseEther: jest.fn((value) => BigInt(value)),
  },
  formatEther: jest.fn((value) => '1.0'),
}));

// Mock wallet service
jest.mock('@/services/walletService', () => ({
  getConnectedWalletType: jest.fn(),
  disconnectWallet: jest.fn(),
  WalletType: {
    METAMASK: 'metamask',
    WALLETCONNECT: 'walletconnect',
  },
}));

// Mock contract service
jest.mock('@/services/contractService', () => ({
  default: {
    getSMTokenBalance: jest.fn().mockResolvedValue('100'),
    getFlowerBalance: jest.fn().mockResolvedValue('50'),
  },
}));

// Test component that uses wallet context
const TestComponent = () => {
  const {
    isConnected,
    address,
    balance,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div data-testid="address">{address || 'No address'}</div>
      <div data-testid="balance">
        BNB: {balance?.bnb || '0'}, SM: {balance?.sm || '0'}
      </div>
      <button onClick={connectWallet} data-testid="connect-btn">
        Connect
      </button>
      <button onClick={disconnectWallet} data-testid="disconnect-btn">
        Disconnect
      </button>
      <button onClick={() => switchNetwork(56)} data-testid="switch-network-btn">
        Switch Network
      </button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <WalletProvider>
      {component}
    </WalletProvider>
  );
};

describe('WalletContext', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: {
        request: jest.fn(),
        on: jest.fn(),
        removeListener: jest.fn(),
        isMetaMask: true,
      },
      writable: true,
    });
  });

  it('provides initial wallet state', () => {
    renderWithProvider(<TestComponent />);
    
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
    expect(screen.getByTestId('address')).toHaveTextContent('No address');
    expect(screen.getByTestId('balance')).toHaveTextContent('BNB: 0, SM: 0');
  });

  it('handles wallet connection', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890'];
    
    (window.ethereum as any).request.mockImplementation((params: any) => {
      if (params.method === 'eth_requestAccounts') {
        return Promise.resolve(mockAccounts);
      }
      if (params.method === 'eth_getBalance') {
        return Promise.resolve('0x1bc16d674ec80000'); // 2 ETH in wei
      }
      if (params.method === 'eth_chainId') {
        return Promise.resolve('0x38'); // BSC mainnet
      }
      return Promise.resolve();
    });

    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('connect-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    });
    
    expect(window.ethereum.request).toHaveBeenCalledWith({
      method: 'eth_requestAccounts',
    });
  });

  it('handles wallet disconnection', async () => {
    renderWithProvider(<TestComponent />);
    
    // First connect
    (window.ethereum as any).request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
    fireEvent.click(screen.getByTestId('connect-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    });
    
    // Then disconnect
    fireEvent.click(screen.getByTestId('disconnect-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
    });
  });

  it('handles network switching', async () => {
    renderWithProvider(<TestComponent />);
    
    (window.ethereum as any).request.mockImplementation((params: any) => {
      if (params.method === 'wallet_switchEthereumChain') {
        return Promise.resolve();
      }
      return Promise.resolve();
    });
    
    fireEvent.click(screen.getByTestId('switch-network-btn'));
    
    await waitFor(() => {
      expect(window.ethereum.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // BSC mainnet
      });
    });
  });

  it('handles connection errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    (window.ethereum as any).request.mockRejectedValue(new Error('User rejected'));
    
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('connect-btn'));
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
    
    consoleSpy.mockRestore();
  });

  it('updates balance when connected', async () => {
    const mockAccounts = ['0x1234567890123456789012345678901234567890'];
    
    (window.ethereum as any).request.mockImplementation((params: any) => {
      if (params.method === 'eth_requestAccounts') {
        return Promise.resolve(mockAccounts);
      }
      if (params.method === 'eth_getBalance') {
        return Promise.resolve('0x1bc16d674ec80000'); // 2 ETH in wei
      }
      return Promise.resolve();
    });

    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('connect-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('balance')).toHaveTextContent('BNB: 1.0');
    });
  });

  it('handles account changes', async () => {
    renderWithProvider(<TestComponent />);
    
    // Simulate account change
    const accountChangeHandler = (window.ethereum as any).on.mock.calls
      .find((call: any) => call[0] === 'accountsChanged')?.[1];
    
    if (accountChangeHandler) {
      accountChangeHandler(['0x9876543210987654321098765432109876543210']);
    }
    
    // Should trigger wallet state update
    expect(window.ethereum.on).toHaveBeenCalledWith('accountsChanged', expect.any(Function));
  });

  it('handles chain changes', async () => {
    renderWithProvider(<TestComponent />);
    
    // Simulate chain change
    const chainChangeHandler = (window.ethereum as any).on.mock.calls
      .find((call: any) => call[0] === 'chainChanged')?.[1];
    
    if (chainChangeHandler) {
      chainChangeHandler('0x1'); // Ethereum mainnet
    }
    
    expect(window.ethereum.on).toHaveBeenCalledWith('chainChanged', expect.any(Function));
  });
});
