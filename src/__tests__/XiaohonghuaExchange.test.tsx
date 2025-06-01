import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import XiaohonghuaExchange from '../XiaohonghuaExchange';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';

// 模拟依赖
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// 模拟fetch
global.fetch = jest.fn();

describe('XiaohonghuaExchange', () => {
  // 模拟Supabase客户端
  const mockSupabase = {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
            access_token: 'mock-token',
          },
        },
        error: null,
      }),
    },
    from: jest.fn().mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: table === 'users' 
          ? { xiaohonghua_balance: 100 } 
          : { xiaohonghua_to_sm_rate: 10 },
        error: null,
      }),
    })),
  };

  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 默认模拟值
    (useAccount as jest.Mock).mockReturnValue({
      address: '0x123456789abcdef',
      isConnected: true,
    });
    
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    
    // 模拟fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        data: {
          smAmount: 1000,
        },
      }),
    });
  });

  it('renders wallet not connected message when not connected', () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: undefined,
      isConnected: false,
    });
    
    render(<XiaohonghuaExchange />);
    expect(screen.getByText('请连接钱包使用兑换功能')).toBeInTheDocument();
  });

  it('renders login required message when not logged in', () => {
    // 模拟未登录
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });
    
    render(<XiaohonghuaExchange />);
    
    // 等待异步操作完成
    return waitFor(() => {
      expect(screen.getByText('请登录以使用兑换功能')).toBeInTheDocument();
    });
  });

  it('renders exchange form with correct user data', async () => {
    render(<XiaohonghuaExchange />);
    
    await waitFor(() => {
      // 检查标题
      expect(screen.getByText('小红花兑换')).toBeInTheDocument();
      
      // 检查余额
      expect(screen.getByText('100')).toBeInTheDocument();
      
      // 检查兑换比率
      expect(screen.getByText('1 小红花 = 10 SM')).toBeInTheDocument();
      
      // 检查兑换按钮
      expect(screen.getByText('兑换')).toBeInTheDocument();
      expect(screen.getByText('兑换')).toBeDisabled();
    });
  });

  it('updates exchange amount and estimated SM when input changes', async () => {
    render(<XiaohonghuaExchange />);
    
    await waitFor(() => {
      expect(screen.getByText('小红花兑换')).toBeInTheDocument();
    });
    
    // 找到输入框
    const input = screen.getByPlaceholderText('输入小红花数量');
    
    // 输入兑换数量
    fireEvent.change(input, { target: { value: '50' } });
    
    // 检查预计获得的SM数量
    await waitFor(() => {
      expect(screen.getByText('500 SM')).toBeInTheDocument();
    });
    
    // 检查兑换按钮是否启用
    expect(screen.getByText('兑换')).not.toBeDisabled();
  });

  it('sets max amount when max button is clicked', async () => {
    render(<XiaohonghuaExchange />);
    
    await waitFor(() => {
      expect(screen.getByText('小红花兑换')).toBeInTheDocument();
    });
    
    // 找到最大按钮
    const maxButton = screen.getByText('最大');
    
    // 点击最大按钮
    fireEvent.click(maxButton);
    
    // 检查输入框的值
    const input = screen.getByPlaceholderText('输入小红花数量') as HTMLInputElement;
    expect(input.value).toBe('100');
    
    // 检查预计获得的SM数量
    await waitFor(() => {
      expect(screen.getByText('1,000 SM')).toBeInTheDocument();
    });
  });

  it('shows error when exchange amount exceeds balance', async () => {
    render(<XiaohonghuaExchange />);
    
    await waitFor(() => {
      expect(screen.getByText('小红花兑换')).toBeInTheDocument();
    });
    
    // 找到输入框
    const input = screen.getByPlaceholderText('输入小红花数量');
    
    // 输入超过余额的数量
    fireEvent.change(input, { target: { value: '150' } });
    
    // 检查输入框的值是否被限制为最大余额
    const inputElement = input as HTMLInputElement;
    expect(inputElement.value).toBe('100');
  });

  it('submits exchange request and shows success message', async () => {
    render(<XiaohonghuaExchange onExchangeComplete={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('小红花兑换')).toBeInTheDocument();
    });
    
    // 找到输入框和兑换按钮
    const input = screen.getByPlaceholderText('输入小红花数量');
    
    // 输入兑换数量
    fireEvent.change(input, { target: { value: '50' } });
    
    // 等待按钮启用
    await waitFor(() => {
      expect(screen.getByText('兑换')).not.toBeDisabled();
    });
    
    // 点击兑换按钮
    fireEvent.click(screen.getByText('兑换'));
    
    // 检查是否显示处理中
    expect(screen.getByText('处理中...')).toBeInTheDocument();
    
    // 等待成功消息
    await waitFor(() => {
      expect(screen.getByText('成功兑换 1000 SM')).toBeInTheDocument();
    });
    
    // 检查余额是否更新
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('shows error message when exchange fails', async () => {
    // 模拟请求失败
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({
        message: '兑换失败，小红花余额不足',
      }),
    });
    
    render(<XiaohonghuaExchange />);
    
    await waitFor(() => {
      expect(screen.getByText('小红花兑换')).toBeInTheDocument();
    });
    
    // 找到输入框和兑换按钮
    const input = screen.getByPlaceholderText('输入小红花数量');
    
    // 输入兑换数量
    fireEvent.change(input, { target: { value: '50' } });
    
    // 等待按钮启用
    await waitFor(() => {
      expect(screen.getByText('兑换')).not.toBeDisabled();
    });
    
    // 点击兑换按钮
    fireEvent.click(screen.getByText('兑换'));
    
    // 等待错误消息
    await waitFor(() => {
      expect(screen.getByText('兑换失败，小红花余额不足')).toBeInTheDocument();
    });
  });

  it('calls onExchangeComplete callback when exchange succeeds', async () => {
    const mockCallback = jest.fn();
    render(<XiaohonghuaExchange onExchangeComplete={mockCallback} />);
    
    await waitFor(() => {
      expect(screen.getByText('小红花兑换')).toBeInTheDocument();
    });
    
    // 找到输入框和兑换按钮
    const input = screen.getByPlaceholderText('输入小红花数量');
    
    // 输入兑换数量
    fireEvent.change(input, { target: { value: '50' } });
    
    // 等待按钮启用
    await waitFor(() => {
      expect(screen.getByText('兑换')).not.toBeDisabled();
    });
    
    // 点击兑换按钮
    fireEvent.click(screen.getByText('兑换'));
    
    // 等待成功消息
    await waitFor(() => {
      expect(screen.getByText('成功兑换 1000 SM')).toBeInTheDocument();
    });
    
    // 检查回调是否被调用
    expect(mockCallback).toHaveBeenCalled();
  });
});
