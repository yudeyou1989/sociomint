import { useState, useEffect } from 'react';
import { formatUnits } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import { contractAbis, contractAddresses } from '../config/contracts';

export function useSMToken() {
  const { address, isConnected } = useAccount();
  const [balanceData, setBalanceData] = useState<bigint | undefined>(undefined);
  const [decimals, setDecimals] = useState<number>(18); // 默认小数位数为18
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [formattedBalance, setFormattedBalance] = useState('0');

  // 使用 wagmi 的 useReadContract 钩子读取代币小数位数
  const { data: tokenDecimals } = useReadContract({
    address: contractAddresses.smToken,
    abi: contractAbis.smToken,
    functionName: 'decimals',
    enabled: isConnected,
  });

  // 使用 wagmi 的 useReadContract 钩子读取代币余额
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: contractAddresses.smToken,
    abi: contractAbis.smToken,
    functionName: 'balanceOf',
    args: [address],
    enabled: isConnected && !!address,
  });

  // 当获取到小数位数时更新状态
  useEffect(() => {
    if (tokenDecimals !== undefined) {
      setDecimals(Number(tokenDecimals));
    }
  }, [tokenDecimals]);

  // 当获取到余额时更新状态
  useEffect(() => {
    if (tokenBalance !== undefined) {
      setBalanceData(tokenBalance);
      
      // 格式化余额
      if (decimals !== undefined) {
        const formatted = formatUnits(tokenBalance, decimals);
        setFormattedBalance(formatted);
      }
    }
  }, [tokenBalance, decimals]);

  // 手动刷新功能
  const refetch = () => {
    refetchBalance();
  };

  return {
    balance: balanceData,
    formattedBalance,
    isLoading,
    error,
    refetch,
  };
}
