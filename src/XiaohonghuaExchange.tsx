import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface XiaohonghuaExchangeProps {
  className?: string;
  onExchangeComplete?: () => void;
}

interface ExchangeState {
  xiaohonghuaBalance: number;
  exchangeRate: number;
  exchangeAmount: number;
  estimatedSm: number;
  loading: boolean;
  error: string | null;
  success: string | null;
  userSession: any;
}

const initialState: ExchangeState = {
  xiaohonghuaBalance: 0,
  exchangeRate: 10, // 默认1小红花=10SM
  exchangeAmount: 0,
  estimatedSm: 0,
  loading: false,
  error: null,
  success: null,
  userSession: null
};

const XiaohonghuaExchange: React.FC<XiaohonghuaExchangeProps> = ({
  className,
  onExchangeComplete
}) => {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<ExchangeState>(initialState);

  const {
    xiaohonghuaBalance,
    exchangeRate,
    exchangeAmount,
    estimatedSm,
    loading,
    error,
    success,
    userSession
  } = state;

  // 获取用户会话
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data.session) {
        setState(prev => ({ ...prev, userSession: data.session }));
      }
    };

    getSession();
  }, []);

  // 获取用户小红花余额和兑换率
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userSession) return;

      try {
        // 并行获取用户数据和兑换率
        const [userResponse, rateResponse] = await Promise.all([
          supabase
            .from('users')
            .select('xiaohonghua_balance')
            .eq('id', userSession.user.id)
            .single(),
          supabase
            .from('exchange_rates')
            .select('xiaohonghua_to_sm_rate')
            .eq('is_active', true)
            .single()
        ]);

        // 处理错误
        if (userResponse.error) throw userResponse.error;
        if (rateResponse.error) throw rateResponse.error;

        // 更新状态
        setState(prev => ({
          ...prev,
          xiaohonghuaBalance: userResponse.data?.xiaohonghua_balance || 0,
          exchangeRate: rateResponse.data?.xiaohonghua_to_sm_rate || 10
        }));
      } catch (err) {
        console.error('获取用户数据失败:', err);
        setState(prev => ({ ...prev, error: '获取用户数据失败，请稍后再试' }));
      }
    };

    fetchUserData();
  }, [userSession]);

  // 计算预估SM数量
  useEffect(() => {
    setState(prev => ({ ...prev, estimatedSm: prev.exchangeAmount * prev.exchangeRate }));
  }, [exchangeAmount, exchangeRate]);

  // 处理兑换金额变化
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setState(prev => ({
      ...prev,
      exchangeAmount: isNaN(value) || value < 0 ? 0 : Math.min(value, prev.xiaohonghuaBalance)
    }));
  }, []);

  // 设置最大兑换金额
  const handleSetMax = useCallback(() => {
    setState(prev => ({ ...prev, exchangeAmount: prev.xiaohonghuaBalance }));
  }, []);

  // 提交兑换请求
  const handleExchange = useCallback(async () => {
    if (!userSession) {
      setState(prev => ({ ...prev, error: '请先登录' }));
      return;
    }

    if (exchangeAmount <= 0) {
      setState(prev => ({ ...prev, error: '请输入有效的兑换金额' }));
      return;
    }

    if (exchangeAmount > xiaohonghuaBalance) {
      setState(prev => ({ ...prev, error: '兑换金额不能超过余额' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null, success: null }));

      // 调用Supabase Function进行兑换
      const response = await fetch(`${supabaseUrl}/functions/v1/exchange-xiaohonghua`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.access_token}`
        },
        body: JSON.stringify({ xiaohonghuaAmount: exchangeAmount })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '兑换请求失败');
      }

      // 更新状态
      setState(prev => ({
        ...prev,
        xiaohonghuaBalance: prev.xiaohonghuaBalance - exchangeAmount,
        exchangeAmount: 0,
        success: `成功兑换 ${result.data.smAmount} SM`,
        loading: false
      }));

      // 通知父组件兑换完成
      if (onExchangeComplete) {
        onExchangeComplete();
      }
    } catch (err: any) {
      console.error('兑换失败:', err);
      setState(prev => ({
        ...prev,
        error: err.message || '兑换失败，请稍后再试',
        loading: false
      }));
    }
  }, [exchangeAmount, xiaohonghuaBalance, userSession, onExchangeComplete]);

  // 计算按钮状态
  const isButtonDisabled = useMemo(() => {
    return loading || exchangeAmount <= 0 || exchangeAmount > xiaohonghuaBalance;
  }, [loading, exchangeAmount, xiaohonghuaBalance]);

  // 渲染内容
  const renderContent = () => {
    if (!isConnected) {
      return <p className="text-center text-gray-400">请连接钱包使用兑换功能</p>;
    }

    if (!userSession) {
      return <p className="text-center text-gray-400">请登录以使用兑换功能</p>;
    }

    return (
      <>
        <h2 className="text-xl font-bold mb-4 text-white">小红花兑换</h2>

        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">小红花余额:</span>
            <span className="text-white">{xiaohonghuaBalance.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">兑换比率:</span>
            <span className="text-white">1 小红花 = {exchangeRate} SM</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-400 mb-1">兑换数量</label>
          <div className="flex items-center">
            <input
              type="number"
              value={exchangeAmount || ''}
              onChange={handleAmountChange}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-l-lg focus:outline-none"
              placeholder="输入小红花数量"
              disabled={loading}
            />
            <button
              onClick={handleSetMax}
              className="bg-gray-600 text-white px-3 py-2 rounded-r-lg hover:bg-gray-500"
              disabled={loading}
            >
              最大
            </button>
          </div>
        </div>

        <div className="mb-6 p-3 bg-gray-700 rounded-lg">
          <div className="flex justify-between">
            <span className="text-gray-400">预计获得:</span>
            <span className="text-white font-bold">{estimatedSm.toLocaleString()} SM</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-400">
            {success}
          </div>
        )}

        <button
          onClick={handleExchange}
          disabled={isButtonDisabled}
          className={`w-full py-3 rounded-lg font-medium flex justify-center items-center
            ${isButtonDisabled
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#0de5ff] to-[#8b3dff] text-white hover:from-[#0bc9e0] hover:to-[#7a35e0]'
            }`}
        >
          {loading ? '处理中...' : '兑换'}
        </button>
      </>
    );
  };

  return (
    <div className={`p-4 rounded-lg bg-gray-800 ${className}`}>
      {renderContent()}
    </div>
  );
};

export default XiaohonghuaExchange;
