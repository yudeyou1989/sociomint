'use client';

import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, SM_EXCHANGE_ABI } from '@/constants/contracts';

export function useSMExchange() {
  const { address, isConnected } = useAccount();

  // 获取交易所统计信息
  const { 
    data: exchangeStats, 
    refetch: refetchExchangeStats,
    isLoading: isLoadingStats,
    error: statsError
  } = useContractRead({
    address: CONTRACT_ADDRESSES.exchange as `0x${string}`,
    abi: SM_EXCHANGE_ABI,
    functionName: 'getExchangeStats',
    enabled: isConnected,
  });

  // 解析交易所统计信息
  const totalTokensSold = exchangeStats ? exchangeStats[0] : BigInt(0);
  const totalTokensRemaining = exchangeStats ? exchangeStats[1] : BigInt(0);
  const totalBnbRaised = exchangeStats ? exchangeStats[2] : BigInt(0);
  const currentPrice = exchangeStats ? exchangeStats[3] : BigInt(0);
  const nextRoundPrice = exchangeStats ? exchangeStats[4] : BigInt(0);

  // 获取用户数据
  const { 
    data: userData, 
    refetch: refetchUserData,
    isLoading: isLoadingUserData,
    error: userDataError
  } = useContractRead({
    address: CONTRACT_ADDRESSES.exchange as `0x${string}`,
    abi: SM_EXCHANGE_ABI,
    functionName: 'userData',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address,
  });

  // 解析用户数据
  const totalPurchases = userData ? userData[0] : BigInt(0);
  const isVerified = userData ? userData[1] : false;
  const lastPurchaseTime = userData ? Number(userData[2]) : 0;
  const hasRefundRequest = userData ? userData[3] : false;

  // 兑换代币函数
  const { 
    data: exchangeData,
    write: exchangeTokens,
    isLoading: isExchanging,
    isSuccess: isExchangeSuccess,
    error: exchangeError
  } = useContractWrite({
    address: CONTRACT_ADDRESSES.exchange as `0x${string}`,
    abi: SM_EXCHANGE_ABI,
    functionName: 'exchangeTokens',
  });

  // 等待兑换交易确认
  const { 
    isLoading: isExchangePending,
    isSuccess: isExchangeConfirmed
  } = useWaitForTransaction({
    hash: exchangeData?.hash,
  });

  // 计算BNB可获得的代币数量
  const calculateTokenAmount = (bnbAmount: string) => {
    if (!bnbAmount || !currentPrice || BigInt(currentPrice) === BigInt(0)) {
      return '0';
    }
    
    try {
      const bnbValue = parseEther(bnbAmount);
      const tokenAmount = bnbValue * BigInt(10**18) / currentPrice;
      return (Number(tokenAmount) / 10**18).toFixed(2);
    } catch (error) {
      console.error('计算代币数量错误:', error);
      return '0';
    }
  };

  // 执行兑换代币
  const performExchange = async (bnbAmount: string) => {
    if (!bnbAmount) return false;
    
    try {
      exchangeTokens({
        value: parseEther(bnbAmount),
      });
      return true;
    } catch (error) {
      console.error('兑换代币错误:', error);
      return false;
    }
  };

  return {
    // 交易所状态
    totalTokensSold,
    totalTokensRemaining,
    totalBnbRaised,
    currentPrice,
    nextRoundPrice,
    refetchExchangeStats,
    isLoadingStats,
    statsError,
    
    // 用户数据
    totalPurchases,
    isVerified,
    lastPurchaseTime,
    hasRefundRequest,
    refetchUserData,
    isLoadingUserData,
    userDataError,
    
    // 兑换功能
    exchangeTokens: performExchange,
    isExchanging: isExchanging || isExchangePending,
    isExchangeSuccess: isExchangeSuccess && isExchangeConfirmed,
    exchangeError,
    exchangeTxHash: exchangeData?.hash,
    
    // 工具函数
    calculateTokenAmount,
    
    // 连接状态
    isConnected,
    address
  };
}
