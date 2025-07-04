/**
 * 空投池列表组件
 * 显示所有可用的小红花空投池
 */

import React, { useState, useEffect } from 'react';
import { AirdropPool } from '@/types/global';
import { AirdropPoolListProps } from '@/types/components';
import { secureHttpClient } from '@/lib/secureHttpClient';
import { useWallet } from '@/contexts/WalletContext';

export default function AirdropPoolList({
  pools: propPools,
  isLoading: propLoading,
  onPoolClick,
  onRefresh,
  className,
  ...props
}: AirdropPoolListProps) {
  const { wallet } = useWallet();
  const [pools, setPools] = useState<AirdropPool[]>(propPools || []);
  const [isLoading, setIsLoading] = useState<boolean>(propLoading || false);
  const [userParticipations, setUserParticipations] = useState<any[]>([]);

  // 获取空投池列表
  const fetchPools = async () => {
    setIsLoading(true);
    try {
      const response = await secureHttpClient.get('/airdrop-pools');
      if (response.success && response.data) {
        setPools(response.data);
      }
    } catch (error) {
      console.error('获取空投池列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取用户参与记录
  const fetchUserParticipations = async () => {
    if (!wallet.address) return;
    
    try {
      const response = await secureHttpClient.get(`/airdrop-pools/participate?walletAddress=${wallet.address}`);
      if (response.success && response.data) {
        setUserParticipations(response.data);
      }
    } catch (error) {
      console.error('获取用户参与记录失败:', error);
    }
  };

  useEffect(() => {
    if (!propPools) {
      fetchPools();
    }
    if (wallet.address) {
      fetchUserParticipations();
    }
  }, [propPools, wallet.address]);

  // 刷新数据
  const handleRefresh = async () => {
    await fetchPools();
    await fetchUserParticipations();
    if (onRefresh) {
      onRefresh();
    }
  };

  // 检查用户是否已参与
  const isUserParticipated = (poolId: string): boolean => {
    return userParticipations.some(p => p.poolId === poolId);
  };

  // 获取用户参与信息
  const getUserParticipation = (poolId: string) => {
    return userParticipations.find(p => p.poolId === poolId);
  };

  // 获取池状态
  const getPoolStatus = (pool: AirdropPool): 'upcoming' | 'active' | 'ended' | 'full' => {
    const now = Date.now();
    
    if (now < pool.startDate) return 'upcoming';
    if (now > pool.endDate) return 'ended';
    if (pool.currentParticipants >= pool.maxParticipants) return 'full';
    return 'active';
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      case 'full':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '即将开始';
      case 'active':
        return '进行中';
      case 'ended':
        return '已结束';
      case 'full':
        return '已满员';
      default:
        return '未知';
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 计算进度百分比
  const getProgressPercentage = (pool: AirdropPool): number => {
    return Math.min((pool.currentParticipants / pool.maxParticipants) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className || ''}`} {...props}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className || ''}`} {...props}>
      {/* 头部 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">小红花空投池</h2>
          <button
            onClick={handleRefresh}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            刷新
          </button>
        </div>
        <p className="text-gray-600 mt-1">使用小红花参与空投，获得SM代币奖励</p>
      </div>

      {/* 空投池列表 */}
      <div className="p-6">
        {pools.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <p className="text-gray-500">暂无可用空投池</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pools.map((pool) => {
              const status = getPoolStatus(pool);
              const isParticipated = isUserParticipated(pool.id);
              const participation = getUserParticipation(pool.id);
              const progressPercentage = getProgressPercentage(pool);

              return (
                <div
                  key={pool.id}
                  className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onPoolClick && onPoolClick(pool)}
                >
                  {/* 头部信息 */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{pool.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(status)}`}>
                          {getStatusText(status)}
                        </span>
                        {isParticipated && (
                          <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            已参与
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{pool.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {pool.totalReward} {pool.tokenType}
                      </div>
                      <div className="text-sm text-gray-500">总奖励</div>
                    </div>
                  </div>

                  {/* 详细信息 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-500">
                        🌺 {pool.entryFee}
                      </div>
                      <div className="text-xs text-gray-500">入场费</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {pool.currentParticipants}/{pool.maxParticipants}
                      </div>
                      <div className="text-xs text-gray-500">参与人数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {formatTime(pool.startDate)}
                      </div>
                      <div className="text-xs text-gray-500">开始时间</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {formatTime(pool.endDate)}
                      </div>
                      <div className="text-xs text-gray-500">结束时间</div>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>参与进度</span>
                      <span>{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 用户参与信息 */}
                  {isParticipated && participation && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span>您的投入:</span>
                          <span className="font-medium">🌺 {participation.entryAmount}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span>参与时间:</span>
                          <span>{formatTime(participation.participatedAt)}</span>
                        </div>
                        {participation.reward && (
                          <div className="flex justify-between">
                            <span>获得奖励:</span>
                            <span className="font-medium text-green-600">
                              {participation.reward} {pool.tokenType}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 分发时间 */}
                  <div className="mt-4 text-center text-sm text-gray-500">
                    奖励分发时间: {formatTime(pool.distributionDate)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
