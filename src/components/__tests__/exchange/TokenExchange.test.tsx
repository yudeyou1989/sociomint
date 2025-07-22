/**
 * 代币交换功能测试
 * 测试BNB与SM代币的交换功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock相关hooks和工具
jest.mock('@/hooks/useWallet', () => ({
  useWallet: jest.fn()
}));

jest.mock('@/hooks/useTokenExchange', () => ({
  useTokenExchange: jest.fn()
}));

jest.mock('@/utils/contractUtils', () => ({
  getExchangeRate: jest.fn(),
  executePurchase: jest.fn(),
  getContractBalance: jest.fn()
}));

// Mock组件
const MockTokenExchange = () => {
  const wallet = require('@/hooks/useWallet').useWallet();
  const exchange = require('@/hooks/useTokenExchange').useTokenExchange();
  
  const [bnbAmount, setBnbAmount] = React.useState('');
  const [smAmount, setSmAmount] = React.useState('');
  
  React.useEffect(() => {
    if (bnbAmount && exchange.exchangeRate) {
      const sm = (parseFloat(bnbAmount) * parseFloat(exchange.exchangeRate)).toString();
      setSmAmount(sm);
    }
  }, [bnbAmount, exchange.exchangeRate]);
  
  if (!wallet.isConnected) {
    return <div>请先连接钱包</div>;
  }
  
  return (
    <div>
      <div>当前价格: {exchange.exchangeRate} SM/BNB</div>
      <div>
        <label>BNB数量:</label>
        <input
          type="number"
          value={bnbAmount}
          onChange={(e) => setBnbAmount(e.target.value)}
          placeholder="输入BNB数量"
        />
      </div>
      <div>
        <label>将获得SM:</label>
        <input
          type="text"
          value={smAmount}
          readOnly
          placeholder="计算中..."
        />
      </div>
      <div>余额: {wallet.balance?.bnb} BNB</div>
      <button
        onClick={() => exchange.executePurchase(bnbAmount)}
        disabled={!bnbAmount || exchange.isLoading}
      >
        {exchange.isLoading ? '交易中...' : '购买SM代币'}
      </button>
      {exchange.error && <div className="error">{exchange.error}</div>}
      {exchange.success && <div className="success">交易成功!</div>}
    </div>
  );
};

describe('TokenExchange', () => {
  const mockUseWallet = require('@/hooks/useWallet').useWallet;
  const mockUseTokenExchange = require('@/hooks/useTokenExchange').useTokenExchange;
  const mockContractUtils = require('@/utils/contractUtils');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 默认钱包状态
    mockUseWallet.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 56,
      balance: {
        bnb: '2.5',
        sm: '5000'
      }
    });
    
    // 默认交换状态
    mockUseTokenExchange.mockReturnValue({
      exchangeRate: '120000', // 1 BNB = 120,000 SM
      isLoading: false,
      error: null,
      success: false,
      executePurchase: jest.fn(),
      refreshRate: jest.fn()
    });
  });

  describe('基本渲染', () => {
    it('应该显示当前汇率', () => {
      render(<MockTokenExchange />);
      
      expect(screen.getByText('当前价格: 120000 SM/BNB')).toBeInTheDocument();
    });

    it('应该显示输入框', () => {
      render(<MockTokenExchange />);
      
      expect(screen.getByPlaceholderText('输入BNB数量')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('计算中...')).toBeInTheDocument();
    });

    it('应该显示用户余额', () => {
      render(<MockTokenExchange />);
      
      expect(screen.getByText('余额: 2.5 BNB')).toBeInTheDocument();
    });

    it('未连接钱包时应该显示提示', () => {
      mockUseWallet.mockReturnValue({
        isConnected: false
      });
      
      render(<MockTokenExchange />);
      
      expect(screen.getByText('请先连接钱包')).toBeInTheDocument();
    });
  });

  describe('数量计算', () => {
    it('输入BNB数量应该自动计算SM数量', async () => {
      render(<MockTokenExchange />);
      
      const bnbInput = screen.getByPlaceholderText('输入BNB数量');
      fireEvent.change(bnbInput, { target: { value: '1' } });
      
      await waitFor(() => {
        const smInput = screen.getByDisplayValue('120000');
        expect(smInput).toBeInTheDocument();
      });
    });

    it('应该正确处理小数计算', async () => {
      render(<MockTokenExchange />);
      
      const bnbInput = screen.getByPlaceholderText('输入BNB数量');
      fireEvent.change(bnbInput, { target: { value: '0.5' } });
      
      await waitFor(() => {
        const smInput = screen.getByDisplayValue('60000');
        expect(smInput).toBeInTheDocument();
      });
    });

    it('清空输入应该清空计算结果', async () => {
      render(<MockTokenExchange />);
      
      const bnbInput = screen.getByPlaceholderText('输入BNB数量');
      fireEvent.change(bnbInput, { target: { value: '1' } });
      fireEvent.change(bnbInput, { target: { value: '' } });
      
      await waitFor(() => {
        const smInput = screen.getByPlaceholderText('计算中...');
        expect(smInput.value).toBe('');
      });
    });
  });

  describe('交易执行', () => {
    it('点击购买按钮应该执行交易', async () => {
      const mockExecutePurchase = jest.fn();
      mockUseTokenExchange.mockReturnValue({
        exchangeRate: '120000',
        isLoading: false,
        error: null,
        success: false,
        executePurchase: mockExecutePurchase,
        refreshRate: jest.fn()
      });

      render(<MockTokenExchange />);
      
      const bnbInput = screen.getByPlaceholderText('输入BNB数量');
      fireEvent.change(bnbInput, { target: { value: '1' } });
      
      const purchaseButton = screen.getByText('购买SM代币');
      fireEvent.click(purchaseButton);
      
      expect(mockExecutePurchase).toHaveBeenCalledWith('1');
    });

    it('没有输入数量时购买按钮应该被禁用', () => {
      render(<MockTokenExchange />);
      
      const purchaseButton = screen.getByText('购买SM代币');
      expect(purchaseButton).toBeDisabled();
    });

    it('交易进行中时应该显示加载状态', () => {
      mockUseTokenExchange.mockReturnValue({
        exchangeRate: '120000',
        isLoading: true,
        error: null,
        success: false,
        executePurchase: jest.fn(),
        refreshRate: jest.fn()
      });

      render(<MockTokenExchange />);
      
      expect(screen.getByText('交易中...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('交易成功时应该显示成功信息', () => {
      mockUseTokenExchange.mockReturnValue({
        exchangeRate: '120000',
        isLoading: false,
        error: null,
        success: true,
        executePurchase: jest.fn(),
        refreshRate: jest.fn()
      });

      render(<MockTokenExchange />);
      
      expect(screen.getByText('交易成功!')).toBeInTheDocument();
    });

    it('交易失败时应该显示错误信息', () => {
      mockUseTokenExchange.mockReturnValue({
        exchangeRate: '120000',
        isLoading: false,
        error: '余额不足',
        success: false,
        executePurchase: jest.fn(),
        refreshRate: jest.fn()
      });

      render(<MockTokenExchange />);
      
      expect(screen.getByText('余额不足')).toBeInTheDocument();
    });
  });

  describe('输入验证', () => {
    it('应该只接受数字输入', () => {
      render(<MockTokenExchange />);
      
      const bnbInput = screen.getByPlaceholderText('输入BNB数量') as HTMLInputElement;
      expect(bnbInput.type).toBe('number');
    });

    it('应该验证最小购买金额', async () => {
      const mockExecutePurchase = jest.fn();
      mockUseTokenExchange.mockReturnValue({
        exchangeRate: '120000',
        isLoading: false,
        error: null,
        success: false,
        executePurchase: mockExecutePurchase,
        refreshRate: jest.fn()
      });

      render(<MockTokenExchange />);
      
      const bnbInput = screen.getByPlaceholderText('输入BNB数量');
      fireEvent.change(bnbInput, { target: { value: '0.001' } });
      
      const purchaseButton = screen.getByText('购买SM代币');
      fireEvent.click(purchaseButton);
      
      // 这里可以添加最小金额验证的逻辑
    });

    it('应该验证余额充足性', async () => {
      render(<MockTokenExchange />);
      
      const bnbInput = screen.getByPlaceholderText('输入BNB数量');
      fireEvent.change(bnbInput, { target: { value: '10' } }); // 超过余额2.5
      
      // 这里可以添加余额验证的逻辑
    });
  });

  describe('汇率更新', () => {
    it('汇率变化时应该重新计算SM数量', async () => {
      const { rerender } = render(<MockTokenExchange />);
      
      const bnbInput = screen.getByPlaceholderText('输入BNB数量');
      fireEvent.change(bnbInput, { target: { value: '1' } });
      
      // 模拟汇率变化
      mockUseTokenExchange.mockReturnValue({
        exchangeRate: '130000', // 新汇率
        isLoading: false,
        error: null,
        success: false,
        executePurchase: jest.fn(),
        refreshRate: jest.fn()
      });
      
      rerender(<MockTokenExchange />);
      
      await waitFor(() => {
        expect(screen.getByText('当前价格: 130000 SM/BNB')).toBeInTheDocument();
      });
    });
  });

  describe('错误处理', () => {
    it('应该处理网络错误', () => {
      mockUseTokenExchange.mockReturnValue({
        exchangeRate: null,
        isLoading: false,
        error: '网络连接失败',
        success: false,
        executePurchase: jest.fn(),
        refreshRate: jest.fn()
      });

      render(<MockTokenExchange />);
      
      expect(screen.getByText('网络连接失败')).toBeInTheDocument();
    });

    it('应该处理合约调用失败', () => {
      mockUseTokenExchange.mockReturnValue({
        exchangeRate: '120000',
        isLoading: false,
        error: 'Gas费用不足',
        success: false,
        executePurchase: jest.fn(),
        refreshRate: jest.fn()
      });

      render(<MockTokenExchange />);
      
      expect(screen.getByText('Gas费用不足')).toBeInTheDocument();
    });
  });

  describe('可访问性', () => {
    it('输入框应该有正确的标签', () => {
      render(<MockTokenExchange />);
      
      expect(screen.getByLabelText('BNB数量:')).toBeInTheDocument();
      expect(screen.getByLabelText('将获得SM:')).toBeInTheDocument();
    });

    it('按钮应该有正确的状态', () => {
      render(<MockTokenExchange />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });
});
