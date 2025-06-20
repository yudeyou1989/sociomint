import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther, formatUnits } from 'viem';
import { useState } from 'react';
import { contractAbis, contractAddresses } from '../config/contracts';

// 定义合约返回的原始数据类型
type ExchangeStatsResult = [
  bigint, // totalTokensSold
  bigint, // totalTokensRemaining
  bigint, // totalBnbRaised
  bigint, // currentPrice
  bigint, // nextRoundPrice
  boolean, // isActive
  number  // currentRound
];

export function useSMTokenExchange() {
  const { address, isConnected } = useAccount();
  const [isExchanging, setIsExchanging] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // 读取交易所统计信息
  const { 
    data: exchangeStats, 
    isLoading: isLoadingStats, 
    refetch: refetchStats
  } = useReadContract({
    address: contractAddresses.exchange as `0x${string}`,
    abi: contractAbis.smTokenExchange,
    functionName: 'getExchangeStats',
    enabled: !!contractAddresses.exchange,
  }) as { data: ExchangeStatsResult | undefined, isLoading: boolean, refetch: () => Promise<any> };

  // 准备写入合约函数
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();

  // 执行代币兑换
  const exchangeTokens = async (bnbAmount: string) => {
    if (!isConnected || !address) {
      setError(new Error('请先连接钱包'));
      return;
    }

    setIsExchanging(true);
    setError(null);
    setTxHash(null);

    try {
      // 将BNB数量转换为Wei
      const valueInWei = parseEther(bnbAmount);

      // 调用合约的exchangeTokens函数
      const hash = await writeContractAsync({
        address: contractAddresses.exchange as `0x${string}`,
        abi: contractAbis.smTokenExchange,
        functionName: 'exchangeTokens',
        value: valueInWei,
      });

      setTxHash(hash);
      
      // 交易成功后刷新数据
      await refetchStats();
      
      return hash;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('兑换失败'));
      throw err;
    } finally {
      setIsExchanging(false);
    }
  };

  // 格式化统计数据
  const formattedStats = exchangeStats ? {
    totalTokensSold: exchangeStats[0],
    totalTokensRemaining: exchangeStats[1],
    totalBnbRaised: exchangeStats[2],
    currentPrice: exchangeStats[3],
    nextRoundPrice: exchangeStats[4],
    isActive: exchangeStats[5],
    currentRound: exchangeStats[6],
    // 添加一些格式化的值
    formattedTokensSold: formatUnits(exchangeStats[0], 18),
    formattedTokensRemaining: formatUnits(exchangeStats[1], 18),
    formattedBnbRaised: formatEther(exchangeStats[2]),
    formattedCurrentPrice: formatEther(exchangeStats[3]),
    formattedNextRoundPrice: formatEther(exchangeStats[4]),
  } : null;

  // 为了向后兼容，添加 buyTokens 别名
  const buyTokens = exchangeTokens;

  // 获取当前价格
  const getCurrentPrice = async () => {
    if (formattedStats?.currentPrice) {
      return formattedStats.currentPrice.toString();
    }
    return null;
  };

  return {
    exchangeStats: formattedStats,
    exchangeTokens,
    buyTokens, // 向后兼容
    getCurrentPrice, // 向后兼容
    isLoading: isLoadingStats,
    isLoadingStats,
    isExchanging: isExchanging || isWritePending,
    txHash,
    error,
    refetchStats,
  };
}
