/**
 * 小红花兑换组件
 * 用户可以使用小红花兑换SM代币
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';

interface ExchangeRate {
  smToFlower: number; // 1 SM = ? 小红花
  flowerToSm: number; // 1 小红花 = ? SM
}

interface UserFlowerBalance {
  available: number;
  locked: number;
  total: number;
}

export default function XiaohonghuaExchange() {
  const { wallet } = useWallet();
  const [flowerBalance, setFlowerBalance] = useState<UserFlowerBalance>({
    available: 0,
    locked: 0,
    total: 0
  });
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>({
    smToFlower: 100, // 1 SM = 100 小红花
    flowerToSm: 0.01 // 1 小红花 = 0.01 SM
  });
  const [inputAmount, setInputAmount] = useState<string>('');
  const [exchangeType, setExchangeType] = useState<'smToFlower' | 'flowerToSm'>('flowerToSm');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 获取小红花余额
  useEffect(() => {
    const fetchFlowerBalance = async () => {
      if (!wallet.isConnected || !wallet.address) return;
      
      try {
        // 模拟API调用
        const mockBalance: UserFlowerBalance = {
          available: 1500,
          locked: 200,
          total: 1700
        };
        setFlowerBalance(mockBalance);
      } catch (error) {
        console.error('获取小红花余额失败:', error);
      }
    };

    fetchFlowerBalance();
  }, [wallet.isConnected, wallet.address]);

  // 计算兑换结果
  const calculateExchange = (amount: string): string => {
    if (!amount || isNaN(Number(amount))) return '0';
    
    const inputNum = parseFloat(amount);
    if (exchangeType === 'flowerToSm') {
      return (inputNum * exchangeRate.flowerToSm).toFixed(6);
    } else {
      return (inputNum * exchangeRate.smToFlower).toFixed(0);
    }
  };

  // 处理兑换
  const handleExchange = async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      alert('请输入有效的兑换数量');
      return;
    }

    if (!wallet.isConnected) {
      alert('请先连接钱包');
      return;
    }

    setIsLoading(true);
    try {
      // 模拟兑换过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('兑换成功！');
      setInputAmount('');
      
      // 刷新余额
      // 这里应该调用实际的API来更新余额
    } catch (error) {
      console.error('兑换失败:', error);
      alert('兑换失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">小红花兑换</h2>
      
      {/* 余额显示 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">我的余额</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>可用小红花:</span>
            <span className="font-medium">{flowerBalance.available.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>锁定小红花:</span>
            <span className="font-medium">{flowerBalance.locked.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>SM代币:</span>
            <span className="font-medium">
              {wallet.balance?.sm ? parseFloat(wallet.balance.sm).toFixed(6) : '0.000000'}
            </span>
          </div>
        </div>
      </div>

      {/* 兑换类型选择 */}
      <div className="mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setExchangeType('flowerToSm')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium ${
              exchangeType === 'flowerToSm'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            小红花 → SM
          </button>
          <button
            onClick={() => setExchangeType('smToFlower')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium ${
              exchangeType === 'smToFlower'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            SM → 小红花
          </button>
        </div>
      </div>

      {/* 兑换率显示 */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-700">
          当前兑换率: 1 {exchangeType === 'flowerToSm' ? '小红花' : 'SM'} = {' '}
          {exchangeType === 'flowerToSm' ? exchangeRate.flowerToSm : exchangeRate.smToFlower} {' '}
          {exchangeType === 'flowerToSm' ? 'SM' : '小红花'}
        </div>
      </div>

      {/* 兑换输入 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          输入{exchangeType === 'flowerToSm' ? '小红花' : 'SM'}数量
        </label>
        <input
          type="number"
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
          placeholder={`输入${exchangeType === 'flowerToSm' ? '小红花' : 'SM'}数量`}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          step={exchangeType === 'flowerToSm' ? '1' : '0.000001'}
        />
      </div>

      {/* 兑换预览 */}
      {inputAmount && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <div className="text-sm text-green-700">
            您将获得: {calculateExchange(inputAmount)} {exchangeType === 'flowerToSm' ? 'SM' : '小红花'}
          </div>
        </div>
      )}

      {/* 兑换按钮 */}
      <button
        onClick={handleExchange}
        disabled={isLoading || !inputAmount || !wallet.isConnected}
        className={`w-full py-3 px-4 rounded-lg font-medium ${
          isLoading || !inputAmount || !wallet.isConnected
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isLoading ? '兑换中...' : '确认兑换'}
      </button>

      {/* 连接钱包提示 */}
      {!wallet.isConnected && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <div className="text-sm text-yellow-700">
            请先连接钱包以使用兑换功能
          </div>
        </div>
      )}
    </div>
  );
}
