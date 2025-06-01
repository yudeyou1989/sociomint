'use client';

import React, { useState, useEffect } from 'react';
import { ethers, formatEther, formatUnits } from 'ethers';
import { CONTRACT_ADDRESSES } from './constants/contracts';
import { useAccount } from 'wagmi';
import { hasEthereum } from './services/walletService';

// ABI 片段，只包含我们需要的函数
const TOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

const EXCHANGE_ABI = [
  "function userData(address user) view returns (uint256 totalPurchases, uint256 lastPurchaseTime)",
  "function isUserVerified(address user) view returns (bool)"
];

interface UserBalanceDisplayProps {
  className?: string;
}

// 状态接口
interface UserBalanceState {
  tokenBalance: string;
  totalPurchases: string;
  lastPurchaseTime: number;
  isVerified: boolean;
  tokenSymbol: string;
  loading: boolean;
  error: string | null;
}

const initialState: UserBalanceState = {
  tokenBalance: '0',
  totalPurchases: '0',
  lastPurchaseTime: 0,
  isVerified: false,
  tokenSymbol: 'SM',
  loading: true,
  error: null
};

const UserBalanceDisplay: React.FC<UserBalanceDisplayProps> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<UserBalanceState>(initialState);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isConnected || !address || !hasEthereum()) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // 连接到以太坊网络
        const provider = new ethers.BrowserProvider(window.ethereum);

        // 创建合约实例
        const tokenContract = new ethers.Contract(
          CONTRACT_ADDRESSES.token,
          TOKEN_ABI,
          provider
        );

        const exchangeContract = new ethers.Contract(
          CONTRACT_ADDRESSES.exchange,
          EXCHANGE_ABI,
          provider
        );

        // 并行获取所有数据
        const [symbol, balance, decimals, userData, verified] = await Promise.all([
          tokenContract.symbol(),
          tokenContract.balanceOf(address),
          tokenContract.decimals(),
          exchangeContract.userData(address),
          exchangeContract.isUserVerified(address)
        ]);

        setState({
          tokenSymbol: symbol,
          tokenBalance: formatUnits(balance, decimals),
          totalPurchases: formatEther(userData.totalPurchases),
          lastPurchaseTime: Number(userData.lastPurchaseTime),
          isVerified: verified,
          loading: false,
          error: null
        });
      } catch (err) {
        console.error('获取用户数据失败:', err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: '获取用户数据失败，请稍后再试'
        }));
      }
    };

    fetchUserData();
  }, [address, isConnected]);

  // 格式化时间戳为可读格式
  const formatTimestamp = (timestamp: number): string => {
    if (timestamp === 0) return '从未购买';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // 渲染不同状态的UI
  const renderContent = () => {
    const { loading, error, tokenBalance, tokenSymbol, totalPurchases, lastPurchaseTime, isVerified } = state;

    if (!isConnected) {
      return <p className="text-center text-gray-400">请连接钱包查看您的余额</p>;
    }

    if (loading) {
      return <p className="text-center text-gray-400">加载中...</p>;
    }

    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }

    return (
      <>
        <h2 className="text-xl font-bold mb-4 text-white">用户资产</h2>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">钱包地址:</span>
            <span className="text-white">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">代币余额:</span>
            <span className="text-white">{parseFloat(tokenBalance).toLocaleString()} {tokenSymbol}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">总购买金额:</span>
            <span className="text-white">{parseFloat(totalPurchases).toLocaleString()} BNB</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">最后购买时间:</span>
            <span className="text-white">{formatTimestamp(lastPurchaseTime)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">验证状态:</span>
            <span className={isVerified ? "text-green-500" : "text-red-500"}>
              {isVerified ? "已验证" : "未验证"}
            </span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={`p-4 rounded-lg bg-gray-800 ${className}`}>
      {renderContent()}
    </div>
  );
};

export default UserBalanceDisplay;
