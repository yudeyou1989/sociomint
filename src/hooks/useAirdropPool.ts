import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractRead, useContractReads } from 'wagmi';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { formatEther, parseEther } from 'viem';
import type { Database } from '@/types/supabase';

type SupabaseClient = ReturnType<typeof useSupabaseClient<Database>>;

interface AirdropRound {
  id: bigint;
  startTime: bigint;
  endTime: bigint;
  totalDeposits: bigint;
  totalRewards: bigint;
  participantCount: bigint;
  distributed: boolean;
}

interface UserDeposit {
  amount: bigint;
  roundId: bigint;
  timestamp: bigint;
  claimed: boolean;
}

interface UserBalance {
  redFlower: bigint;
  sm: bigint;
}

interface PoolConfig {
  weeklySmAmount: bigint;
  roundDuration: bigint;
  minDeposit: bigint;
  maxDeposit: bigint;
  isActive: boolean;
}

interface AirdropPoolData {
  currentRound: AirdropRound | null;
  userDeposit: UserDeposit | null;
  userBalance: UserBalance | null;
  poolConfig: PoolConfig | null;
  isLoadingData: boolean;
  error: string | null;
  refetch: () => void;
}

const AIRDROP_POOL_ABI = [
  {
    name: 'getCurrentRound',
    type: 'function',
    inputs: [],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'totalDeposits', type: 'uint256' },
          { name: 'totalRewards', type: 'uint256' },
          { name: 'participantCount', type: 'uint256' },
          { name: 'distributed', type: 'bool' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    name: 'getUserCurrentDeposit',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'amount', type: 'uint256' },
          { name: 'roundId', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'claimed', type: 'bool' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    name: 'poolConfig',
    type: 'function',
    inputs: [],
    outputs: [
      { name: 'weeklySmAmount', type: 'uint256' },
      { name: 'roundDuration', type: 'uint256' },
      { name: 'minDeposit', type: 'uint256' },
      { name: 'maxDeposit', type: 'uint256' },
      { name: 'isActive', type: 'bool' }
    ],
    stateMutability: 'view'
  }
] as const;

const RED_FLOWER_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

const SM_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

export function useAirdropPool(refreshKey: number = 0): AirdropPoolData {
  const { address, isConnected } = useAccount();
  const supabase = useSupabaseClient<Database>();
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);
  
  const airdropPoolAddress = process.env.NEXT_PUBLIC_AIRDROP_POOL_ADDRESS as `0x${string}`;
  const redFlowerTokenAddress = process.env.NEXT_PUBLIC_RED_FLOWER_TOKEN_ADDRESS as `0x${string}`;
  const smTokenAddress = process.env.NEXT_PUBLIC_SM_TOKEN_ADDRESS as `0x${string}`;
  
  // 合约读取配置
  const contractReads = useContractReads({
    contracts: [
      // 获取当前轮次
      {
        address: airdropPoolAddress,
        abi: AIRDROP_POOL_ABI,
        functionName: 'getCurrentRound'
      },
      // 获取池配置
      {
        address: airdropPoolAddress,
        abi: AIRDROP_POOL_ABI,
        functionName: 'poolConfig'
      },
      // 获取用户当前投入（如果已连接钱包）
      ...(isConnected && address ? [{
        address: airdropPoolAddress,
        abi: AIRDROP_POOL_ABI,
        functionName: 'getUserCurrentDeposit',
        args: [address]
      }] : []),
      // 获取用户小红花余额
      ...(isConnected && address ? [{
        address: redFlowerTokenAddress,
        abi: RED_FLOWER_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [address]
      }] : []),
      // 获取用户 SM 余额
      ...(isConnected && address ? [{
        address: smTokenAddress,
        abi: SM_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [address]
      }] : [])
    ],
    watch: true,
    cacheTime: 5000, // 5秒缓存
    staleTime: 2000, // 2秒后标记为过期
    enabled: !!airdropPoolAddress,
    onError: (error) => {
      console.error('Contract read error:', error);
      setError(error.message);
    }
  });
  
  // 解析合约数据
  const parseContractData = useCallback(() => {
    if (!contractReads.data) return null;
    
    try {
      const [currentRoundResult, poolConfigResult, userDepositResult, redFlowerBalanceResult, smBalanceResult] = contractReads.data;
      
      // 解析当前轮次
      const currentRound: AirdropRound | null = currentRoundResult.status === 'success' ? {
        id: currentRoundResult.result[0],
        startTime: currentRoundResult.result[1],
        endTime: currentRoundResult.result[2],
        totalDeposits: currentRoundResult.result[3],
        totalRewards: currentRoundResult.result[4],
        participantCount: currentRoundResult.result[5],
        distributed: currentRoundResult.result[6]
      } : null;
      
      // 解析池配置
      const poolConfig: PoolConfig | null = poolConfigResult.status === 'success' ? {
        weeklySmAmount: poolConfigResult.result[0],
        roundDuration: poolConfigResult.result[1],
        minDeposit: poolConfigResult.result[2],
        maxDeposit: poolConfigResult.result[3],
        isActive: poolConfigResult.result[4]
      } : null;
      
      // 解析用户投入
      const userDeposit: UserDeposit | null = userDepositResult?.status === 'success' ? {
        amount: userDepositResult.result[0],
        roundId: userDepositResult.result[1],
        timestamp: userDepositResult.result[2],
        claimed: userDepositResult.result[3]
      } : null;
      
      // 解析用户余额
      const userBalance: UserBalance | null = (
        redFlowerBalanceResult?.status === 'success' && 
        smBalanceResult?.status === 'success'
      ) ? {
        redFlower: redFlowerBalanceResult.result,
        sm: smBalanceResult.result
      } : null;
      
      return {
        currentRound,
        poolConfig,
        userDeposit,
        userBalance
      };
    } catch (error) {
      console.error('Parse contract data error:', error);
      setError('Failed to parse contract data');
      return null;
    }
  }, [contractReads.data]);
  
  // 从数据库获取补充信息
  const fetchDatabaseData = useCallback(async () => {
    if (!address) return;
    
    try {
      // 获取用户空投统计
      const { data: userStats, error: statsError } = await supabase
        .from('user_airdrop_stats')
        .select('*')
        .eq('user_id', address)
        .single();
      
      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Database query error:', statsError);
      }
      
      // 获取当前轮次详情
      const { data: currentRoundData, error: roundError } = await supabase
        .from('current_airdrop_round')
        .select('*')
        .single();
      
      if (roundError && roundError.code !== 'PGRST116') {
        console.error('Database query error:', roundError);
      }
      
      return {
        userStats,
        currentRoundData
      };
    } catch (error) {
      console.error('Database fetch error:', error);
      return null;
    }
  }, [address, supabase]);
  
  // 主要数据获取效果
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      setError(null);
      
      try {
        // 等待合约数据
        if (contractReads.isLoading) {
          return;
        }
        
        // 获取数据库补充数据
        await fetchDatabaseData();
        
      } catch (error: any) {
        console.error('Load data error:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();
  }, [contractReads.isLoading, fetchDatabaseData, refreshKey, refetchKey]);
  
  // 手动刷新函数
  const refetch = useCallback(() => {
    setRefetchKey(prev => prev + 1);
    contractReads.refetch();
  }, [contractReads]);
  
  // 解析最终数据
  const contractData = parseContractData();
  
  return {
    currentRound: contractData?.currentRound || null,
    userDeposit: contractData?.userDeposit || null,
    userBalance: contractData?.userBalance || null,
    poolConfig: contractData?.poolConfig || null,
    isLoadingData: isLoadingData || contractReads.isLoading,
    error: error || (contractReads.error?.message),
    refetch
  };
}

// 辅助函数：格式化时间剩余
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 辅助函数：格式化数字
export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toFixed(0);
}
