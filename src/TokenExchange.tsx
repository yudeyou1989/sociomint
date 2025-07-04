/**
 * 代币交换组件
 * 用户可以使用BNB购买SM代币
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { NumberInput } from '@/components/ui/SecureInput';

interface ExchangeStats {
  currentPrice: string;
  totalSold: string;
  totalRemaining: string;
  currentRound: number;
  nextRoundPrice: string;
}

export default function TokenExchange() {
  const { wallet, updateBalances } = useWallet();
  const [bnbAmount, setBnbAmount] = useState<string>('');
  const [smAmount, setSmAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<ExchangeStats>({
    currentPrice: '0.000833',
    totalSold: '1000000',
    totalRemaining: '9000000',
    currentRound: 1,
    nextRoundPrice: '0.000975'
  });

  // 获取交换统计信息
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 模拟API调用获取实时数据
        const mockStats: ExchangeStats = {
          currentPrice: '0.000833',
          totalSold: '1250000',
          totalRemaining: '8750000',
          currentRound: 1,
          nextRoundPrice: '0.000975'
        };
        setStats(mockStats);
      } catch (error) {
        console.error('获取交换统计失败:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // 每30秒更新一次

    return () => clearInterval(interval);
  }, []);

  // 计算SM代币数量
  const calculateSMAmount = (bnb: string): string => {
    if (!bnb || isNaN(Number(bnb))) return '0';
    const bnbNum = parseFloat(bnb);
    const priceNum = parseFloat(stats.currentPrice);
    return (bnbNum / priceNum).toFixed(6);
  };

  // 处理BNB输入变化
  const handleBnbChange = (value: string) => {
    setBnbAmount(value);
    setSmAmount(calculateSMAmount(value));
  };

  // 处理SM输入变化
  const handleSmChange = (value: string) => {
    setSmAmount(value);
    if (!value || isNaN(Number(value))) {
      setBnbAmount('0');
      return;
    }
    const smNum = parseFloat(value);
    const priceNum = parseFloat(stats.currentPrice);
    setBnbAmount((smNum * priceNum).toFixed(8));
  };

  // 设置最大BNB数量
  const handleMaxBnb = () => {
    if (wallet.balance?.bnb) {
      const maxBnb = parseFloat(wallet.balance.bnb);
      const adjustedMax = Math.max(0, maxBnb - 0.001).toFixed(6); // 保留gas费
      handleBnbChange(adjustedMax);
    }
  };

  // 执行交换
  const handleExchange = async () => {
    if (!bnbAmount || parseFloat(bnbAmount) <= 0) {
      alert('请输入有效的BNB数量');
      return;
    }

    if (!wallet.isConnected) {
      alert('请先连接钱包');
      return;
    }

    const bnbNum = parseFloat(bnbAmount);
    const currentBnbBalance = wallet.balance ? parseFloat(wallet.balance.bnb) : 0;
    
    if (bnbNum > currentBnbBalance) {
      alert('BNB余额不足');
      return;
    }

    setIsLoading(true);
    try {
      // 模拟交换过程
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      alert(`成功购买 ${smAmount} SM代币！`);
      setBnbAmount('');
      setSmAmount('');
      
      // 更新余额
      await updateBalances();
    } catch (error) {
      console.error('交换失败:', error);
      alert('交换失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 统计信息 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-center mb-6">代币交换</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.currentPrice}</div>
            <div className="text-sm text-gray-600">当前价格 (BNB)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{parseInt(stats.totalSold).toLocaleString()}</div>
            <div className="text-sm text-gray-600">已售出</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{parseInt(stats.totalRemaining).toLocaleString()}</div>
            <div className="text-sm text-gray-600">剩余</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.currentRound}</div>
            <div className="text-sm text-gray-600">当前轮次</div>
          </div>
        </div>
      </div>

      {/* 交换界面 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          {/* BNB输入 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">支付 (BNB)</label>
              {wallet.isConnected && wallet.balance && (
                <div className="text-xs text-gray-500">
                  余额: {parseFloat(wallet.balance.bnb).toFixed(6)} BNB
                  <button
                    onClick={handleMaxBnb}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    最大
                  </button>
                </div>
              )}
            </div>
            <NumberInput
              value={bnbAmount}
              onChange={(e) => handleBnbChange(e.target.value)}
              placeholder="0.0"
              minValue={0.000001}
              maxValue={1000}
              className="w-full text-lg"
            />
          </div>

          {/* 交换箭头 */}
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          {/* SM输出 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">获得 (SM)</label>
              {wallet.isConnected && wallet.balance?.sm && (
                <div className="text-xs text-gray-500">
                  余额: {parseFloat(wallet.balance.sm).toFixed(6)} SM
                </div>
              )}
            </div>
            <NumberInput
              value={smAmount}
              onChange={(e) => handleSmChange(e.target.value)}
              placeholder="0.0"
              minValue={0}
              className="w-full text-lg"
            />
          </div>

          {/* 交换信息 */}
          {bnbAmount && smAmount && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>交换率:</span>
                  <span>1 BNB = {(1 / parseFloat(stats.currentPrice)).toFixed(2)} SM</span>
                </div>
                <div className="flex justify-between">
                  <span>预计gas费:</span>
                  <span>~0.001 BNB</span>
                </div>
                <div className="flex justify-between">
                  <span>滑点容忍:</span>
                  <span>0.5%</span>
                </div>
              </div>
            </div>
          )}

          {/* 交换按钮 */}
          <button
            onClick={handleExchange}
            disabled={isLoading || !bnbAmount || !wallet.isConnected}
            className={`w-full py-4 px-6 rounded-lg font-medium text-lg ${
              isLoading || !bnbAmount || !wallet.isConnected
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isLoading ? '交换中...' : wallet.isConnected ? '确认交换' : '请连接钱包'}
          </button>
        </div>
      </div>

      {/* 下一轮价格提示 */}
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <div className="text-sm text-yellow-800">
          💡 下一轮价格将上涨至 {stats.nextRoundPrice} BNB，越早购买越优惠！
        </div>
      </div>
    </div>
  );
}
