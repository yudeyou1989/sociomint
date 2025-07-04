/**
 * 用户余额显示组件
 * 显示用户的各种代币余额和统计信息
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';

interface UserStats {
  totalPurchased: string;
  totalSpent: string;
  averagePrice: string;
  profitLoss: string;
  profitLossPercentage: string;
}

interface FlowerBalance {
  available: number;
  locked: number;
  earned: number;
  spent: number;
}

export default function UserBalanceDisplay() {
  const { wallet, updateBalances } = useWallet();
  const [userStats, setUserStats] = useState<UserStats>({
    totalPurchased: '0',
    totalSpent: '0',
    averagePrice: '0',
    profitLoss: '0',
    profitLossPercentage: '0'
  });
  const [flowerBalance, setFlowerBalance] = useState<FlowerBalance>({
    available: 0,
    locked: 0,
    earned: 0,
    spent: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 获取用户统计信息
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!wallet.isConnected || !wallet.address) return;
      
      setIsLoading(true);
      try {
        // 模拟API调用获取用户统计
        const mockStats: UserStats = {
          totalPurchased: '50000',
          totalSpent: '41.65',
          averagePrice: '0.000833',
          profitLoss: '+8.35',
          profitLossPercentage: '+20.05'
        };
        
        const mockFlowerBalance: FlowerBalance = {
          available: 1500,
          locked: 200,
          earned: 2000,
          spent: 300
        };
        
        setUserStats(mockStats);
        setFlowerBalance(mockFlowerBalance);
      } catch (error) {
        console.error('获取用户统计失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [wallet.isConnected, wallet.address]);

  // 刷新余额
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await updateBalances();
      // 重新获取统计信息
      // 这里应该调用实际的API
    } catch (error) {
      console.error('刷新余额失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">钱包未连接</h3>
        <p className="text-gray-500">请连接钱包以查看余额信息</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 主要余额卡片 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">我的余额</h2>
            <p className="text-blue-100">钱包地址: {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
          >
            <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">
              {wallet.balance?.bnb ? parseFloat(wallet.balance.bnb).toFixed(6) : '0.000000'}
            </div>
            <div className="text-blue-100">BNB</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {wallet.balance?.sm ? parseFloat(wallet.balance.sm).toFixed(2) : '0.00'}
            </div>
            <div className="text-blue-100">SM 代币</div>
          </div>
        </div>
      </div>

      {/* 小红花余额 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="text-red-500 mr-2">🌺</span>
          小红花余额
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{flowerBalance.available.toLocaleString()}</div>
            <div className="text-sm text-gray-600">可用</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">{flowerBalance.locked.toLocaleString()}</div>
            <div className="text-sm text-gray-600">锁定</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{flowerBalance.earned.toLocaleString()}</div>
            <div className="text-sm text-gray-600">总获得</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">{flowerBalance.spent.toLocaleString()}</div>
            <div className="text-sm text-gray-600">已使用</div>
          </div>
        </div>
      </div>

      {/* 投资统计 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">投资统计</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">总购买量:</span>
            <span className="font-medium">{parseInt(userStats.totalPurchased).toLocaleString()} SM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">总花费:</span>
            <span className="font-medium">{userStats.totalSpent} BNB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">平均价格:</span>
            <span className="font-medium">{userStats.averagePrice} BNB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">盈亏:</span>
            <span className={`font-medium ${userStats.profitLoss.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {userStats.profitLoss} BNB ({userStats.profitLossPercentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">快速操作</h3>
        <div className="grid grid-cols-2 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-blue-500 mb-2">
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="text-sm font-medium">购买代币</div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-green-500 mb-2">
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm font-medium">完成任务</div>
          </button>
        </div>
      </div>
    </div>
  );
}
