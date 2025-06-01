import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractReads } from 'wagmi';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '@/types/supabase';

type SupabaseClient = ReturnType<typeof useSupabaseClient<Database>>;

interface UserRewardInfo {
  smBalance: bigint;
  dailyFlowers: number;
  canClaim: boolean;
  nextClaimTime: number;
  totalClaimed: number;
}

interface DailyRewardStats {
  totalClaimers: number;
  totalFlowersDistributed: number;
  averageFlowersPerUser: number;
  userRank?: number;
}

interface DailyRewardData {
  userRewardInfo: UserRewardInfo | null;
  dailyStats: DailyRewardStats | null;
  leaderboard: Array<{
    rank: number;
    wallet: string;
    username?: string;
    smBalance: number;
    flowersAmount: number;
  }>;
  isLoadingData: boolean;
  error: string | null;
  refetch: () => void;
}

// 合约 ABI
const SM_TOKEN_EXCHANGE_ABI = [
  {
    name: 'getUserDailyRewardInfo',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'smBalance', type: 'uint256' },
      { name: 'dailyFlowers', type: 'uint256' },
      { name: 'canClaim', type: 'bool' },
      { name: 'nextClaimTime', type: 'uint256' },
      { name: 'totalClaimed', type: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    name: 'getDailyRewardConfig',
    type: 'function',
    inputs: [],
    outputs: [
      { name: 'flowersPer500Sm', type: 'uint256' },
      { name: 'maxDailyFlowersPerUser', type: 'uint256' },
      { name: 'dailyClaimInterval', type: 'uint256' }
    ],
    stateMutability: 'view'
  }
] as const;

export function useDailyReward(refreshKey: number = 0): DailyRewardData {
  const { address, isConnected } = useAccount();
  const supabase = useSupabaseClient<Database>();
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyRewardStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<any>>([]);
  
  const smTokenExchangeAddress = process.env.NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS as `0x${string}`;
  
  // 合约读取配置
  const contractReads = useContractReads({
    contracts: [
      // 获取用户每日奖励信息
      ...(isConnected && address ? [{
        address: smTokenExchangeAddress,
        abi: SM_TOKEN_EXCHANGE_ABI,
        functionName: 'getUserDailyRewardInfo',
        args: [address]
      }] : []),
      // 获取每日奖励配置
      {
        address: smTokenExchangeAddress,
        abi: SM_TOKEN_EXCHANGE_ABI,
        functionName: 'getDailyRewardConfig'
      }
    ],
    watch: true,
    cacheTime: 10000, // 10秒缓存
    staleTime: 5000, // 5秒后标记为过期
    enabled: !!smTokenExchangeAddress,
    onError: (error) => {
      console.error('Contract read error:', error);
      setError(error.message);
    }
  });
  
  // 解析合约数据
  const parseContractData = useCallback(() => {
    if (!contractReads.data) return null;
    
    try {
      const [userRewardResult, configResult] = contractReads.data;
      
      // 解析用户奖励信息
      const userRewardInfo: UserRewardInfo | null = userRewardResult?.status === 'success' ? {
        smBalance: userRewardResult.result[0],
        dailyFlowers: Number(userRewardResult.result[1]),
        canClaim: userRewardResult.result[2],
        nextClaimTime: Number(userRewardResult.result[3]),
        totalClaimed: Number(userRewardResult.result[4])
      } : null;
      
      return {
        userRewardInfo
      };
    } catch (error) {
      console.error('Parse contract data error:', error);
      setError('Failed to parse contract data');
      return null;
    }
  }, [contractReads.data]);
  
  // 从数据库获取统计数据
  const fetchDatabaseData = useCallback(async () => {
    try {
      // 获取今日统计数据
      const { data: todayStats, error: statsError } = await supabase
        .from('daily_reward_overview')
        .select('*')
        .eq('claim_date', new Date().toISOString().split('T')[0])
        .single();
      
      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Database stats query error:', statsError);
      }
      
      // 获取排行榜数据
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('current_daily_leaderboard')
        .select('*')
        .order('rank', { ascending: true })
        .limit(20);
      
      if (leaderboardError) {
        console.error('Database leaderboard query error:', leaderboardError);
      }
      
      // 设置统计数据
      if (todayStats) {
        setDailyStats({
          totalClaimers: todayStats.total_claimers || 0,
          totalFlowersDistributed: parseFloat(todayStats.total_flowers_distributed || '0'),
          averageFlowersPerUser: parseFloat(todayStats.average_flowers_per_user || '0')
        });
      }
      
      // 设置排行榜数据
      if (leaderboardData) {
        setLeaderboard(leaderboardData.map(item => ({
          rank: item.rank,
          wallet: item.user_wallet,
          username: item.username,
          smBalance: parseFloat(item.sm_balance || '0'),
          flowersAmount: parseFloat(item.flowers_claimed || '0')
        })));
      }
      
      return {
        todayStats,
        leaderboardData
      };
    } catch (error) {
      console.error('Database fetch error:', error);
      return null;
    }
  }, [supabase]);
  
  // 检查用户是否可以领取奖励（数据库验证）
  const checkCanClaimFromDatabase = useCallback(async () => {
    if (!address) return true;
    
    try {
      const { data: canClaim } = await supabase.rpc('can_claim_daily_reward', {
        p_user_wallet: address,
        p_claim_date: new Date().toISOString().split('T')[0]
      });
      
      return canClaim;
    } catch (error) {
      console.error('Database claim check error:', error);
      return true; // 默认允许领取，由合约进行最终验证
    }
  }, [address, supabase]);
  
  // 获取用户连续领取天数
  const getUserStreak = useCallback(async () => {
    if (!address) return 0;
    
    try {
      const { data: streak } = await supabase.rpc('get_user_streak', {
        p_user_wallet: address
      });
      
      return streak || 0;
    } catch (error) {
      console.error('Database streak query error:', error);
      return 0;
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
        
        // 获取数据库数据
        await Promise.all([
          fetchDatabaseData(),
          checkCanClaimFromDatabase(),
          getUserStreak()
        ]);
        
      } catch (error: any) {
        console.error('Load data error:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();
  }, [contractReads.isLoading, fetchDatabaseData, checkCanClaimFromDatabase, getUserStreak, refreshKey, refetchKey]);
  
  // 手动刷新函数
  const refetch = useCallback(() => {
    setRefetchKey(prev => prev + 1);
    contractReads.refetch();
  }, [contractReads]);
  
  // 解析最终数据
  const contractData = parseContractData();
  
  return {
    userRewardInfo: contractData?.userRewardInfo || null,
    dailyStats,
    leaderboard,
    isLoadingData: isLoadingData || contractReads.isLoading,
    error: error || (contractReads.error?.message),
    refetch
  };
}

// 辅助函数：格式化奖励数量
export function formatRewardAmount(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'K';
  }
  return amount.toFixed(0);
}

// 辅助函数：计算奖励等级
export function getRewardLevel(totalClaimed: number): {
  level: number;
  title: string;
  nextLevelThreshold: number;
  progress: number;
} {
  const levels = [
    { threshold: 0, title: '新手' },
    { threshold: 100, title: '初级' },
    { threshold: 500, title: '中级' },
    { threshold: 1000, title: '高级' },
    { threshold: 2000, title: '专家' },
    { threshold: 5000, title: '大师' },
    { threshold: 10000, title: '传奇' }
  ];
  
  let currentLevel = 0;
  let currentTitle = levels[0].title;
  let nextThreshold = levels[1].threshold;
  
  for (let i = 0; i < levels.length; i++) {
    if (totalClaimed >= levels[i].threshold) {
      currentLevel = i;
      currentTitle = levels[i].title;
      nextThreshold = i < levels.length - 1 ? levels[i + 1].threshold : levels[i].threshold;
    } else {
      break;
    }
  }
  
  const progress = currentLevel === levels.length - 1 ? 100 : 
    ((totalClaimed - levels[currentLevel].threshold) / (nextThreshold - levels[currentLevel].threshold)) * 100;
  
  return {
    level: currentLevel,
    title: currentTitle,
    nextLevelThreshold: nextThreshold,
    progress: Math.min(progress, 100)
  };
}

// 辅助函数：获取奖励建议
export function getRewardSuggestion(smBalance: number, dailyFlowers: number): string {
  if (smBalance === 0) {
    return '购买 SM 代币开始获得每日奖励！';
  }
  
  if (smBalance < 500) {
    return `再购买 ${500 - smBalance} SM 即可获得每日奖励！`;
  }
  
  if (dailyFlowers < 200) {
    const neededSm = (200 - dailyFlowers) * 50; // 每10朵小红花需要500 SM
    return `持有 ${neededSm} 更多 SM 可获得最大每日奖励！`;
  }
  
  return '您已达到最大每日奖励！';
}
