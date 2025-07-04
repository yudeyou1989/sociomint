/**
 * 交易历史组件
 * 显示用户的交易记录
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';

interface Transaction {
  id: string;
  type: 'purchase' | 'exchange' | 'reward' | 'airdrop';
  amount: string;
  token: 'BNB' | 'SM' | 'FLOWER';
  price?: string;
  hash: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  description: string;
}

export default function TransactionHistory() {
  const { wallet } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'exchange' | 'reward'>('all');

  // 获取交易历史
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!wallet.isConnected || !wallet.address) return;
      
      setIsLoading(true);
      try {
        // 模拟API调用获取交易历史
        const mockTransactions: Transaction[] = [
          {
            id: '1',
            type: 'purchase',
            amount: '10000',
            token: 'SM',
            price: '8.33',
            hash: '0x1234567890abcdef1234567890abcdef12345678',
            timestamp: Date.now() - 86400000, // 1天前
            status: 'confirmed',
            description: '购买SM代币'
          },
          {
            id: '2',
            type: 'reward',
            amount: '500',
            token: 'FLOWER',
            hash: '0xabcdef1234567890abcdef1234567890abcdef12',
            timestamp: Date.now() - 172800000, // 2天前
            status: 'confirmed',
            description: '完成社交任务奖励'
          },
          {
            id: '3',
            type: 'exchange',
            amount: '100',
            token: 'FLOWER',
            price: '1.0',
            hash: '0x567890abcdef1234567890abcdef1234567890ab',
            timestamp: Date.now() - 259200000, // 3天前
            status: 'confirmed',
            description: '小红花兑换SM代币'
          },
          {
            id: '4',
            type: 'purchase',
            amount: '5000',
            token: 'SM',
            price: '4.165',
            hash: '0x90abcdef1234567890abcdef1234567890abcdef',
            timestamp: Date.now() - 345600000, // 4天前
            status: 'confirmed',
            description: '购买SM代币'
          },
          {
            id: '5',
            type: 'airdrop',
            amount: '1000',
            token: 'FLOWER',
            hash: '0xdef1234567890abcdef1234567890abcdef123456',
            timestamp: Date.now() - 432000000, // 5天前
            status: 'confirmed',
            description: '小红花空投奖励'
          }
        ];
        
        setTransactions(mockTransactions);
      } catch (error) {
        console.error('获取交易历史失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [wallet.isConnected, wallet.address]);

  // 过滤交易
  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 获取交易类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'exchange':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      case 'reward':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        );
      case 'airdrop':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">钱包未连接</h3>
        <p className="text-gray-500">请连接钱包以查看交易历史</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* 头部 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">交易历史</h2>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-500 hover:text-blue-700"
          >
            刷新
          </button>
        </div>
        
        {/* 过滤器 */}
        <div className="flex space-x-2">
          {[
            { key: 'all', label: '全部' },
            { key: 'purchase', label: '购买' },
            { key: 'exchange', label: '兑换' },
            { key: 'reward', label: '奖励' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 交易列表 */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">加载中...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">暂无交易记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  {getTypeIcon(tx.type)}
                  <div>
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-sm text-gray-500">
                      {formatTime(tx.timestamp)} • {tx.hash.slice(0, 10)}...
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {tx.amount} {tx.token}
                  </div>
                  {tx.price && (
                    <div className="text-sm text-gray-500">
                      {tx.price} BNB
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
