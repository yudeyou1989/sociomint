/**
 * 软质押持币验证服务 - 简化版本
 * 仅处理数据库操作，Web3调用在客户端进行
 */

import { createClient } from '@supabase/supabase-js';

// 环境变量
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface BalanceSnapshot {
  id: string;
  user_wallet: string;
  sm_balance: string;
  block_number?: number;
  tx_hash?: string;
  created_at: string;
}

export interface HoldingPeriod {
  id: string;
  user_wallet: string;
  start_time: string;
  end_time?: string;
  min_balance: string;
  is_active: boolean;
  created_at: string;
}

export interface DailyReward {
  id: string;
  user_wallet: string;
  reward_date: string;
  sm_balance: string;
  red_flowers_earned: number;
  is_claimed: boolean;
  created_at: string;
}

export interface SoftStakingConfig {
  min_holding_hours: number;
  flowers_per_500_sm: string;
  max_daily_flowers: string;
  snapshot_interval_hours: number;
  tolerance_percentage: number;
}

export class SoftStakingService {
  /**
   * 记录用户余额快照
   */
  static async recordBalanceSnapshot(
    userWallet: string,
    smBalance: string,
    blockNumber?: number,
    txHash?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('record_balance_snapshot', {
        p_user_wallet: userWallet,
        p_sm_balance: smBalance,
        p_block_number: blockNumber,
        p_tx_hash: txHash
      });

      if (error) {
        console.error('记录余额快照失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('记录余额快照异常:', error);
      return null;
    }
  }

  /**
   * 获取用户余额快照历史
   */
  static async getBalanceSnapshots(
    userWallet: string,
    limit: number = 100
  ): Promise<BalanceSnapshot[]> {
    try {
      const { data, error } = await supabase
        .from('balance_snapshots')
        .select('*')
        .eq('user_wallet', userWallet)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取余额快照失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取余额快照异常:', error);
      return [];
    }
  }

  /**
   * 获取用户持有期记录
   */
  static async getHoldingPeriods(
    userWallet: string,
    limit: number = 50
  ): Promise<HoldingPeriod[]> {
    try {
      const { data, error } = await supabase
        .from('holding_periods')
        .select('*')
        .eq('user_wallet', userWallet)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取持有期记录失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取持有期记录异常:', error);
      return [];
    }
  }

  /**
   * 获取用户每日奖励记录
   */
  static async getDailyRewards(
    userWallet: string,
    limit: number = 30
  ): Promise<DailyReward[]> {
    try {
      const { data, error } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('user_wallet', userWallet)
        .order('reward_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取每日奖励记录失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取每日奖励记录异常:', error);
      return [];
    }
  }

  /**
   * 计算用户可获得的小红花奖励
   */
  static async calculateDailyReward(
    userWallet: string,
    smBalance: string
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_daily_reward', {
        p_user_wallet: userWallet,
        p_sm_balance: smBalance
      });

      if (error) {
        console.error('计算每日奖励失败:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('计算每日奖励异常:', error);
      return 0;
    }
  }

  /**
   * 领取每日奖励
   */
  static async claimDailyReward(
    userWallet: string,
    smBalance: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('claim_daily_reward', {
        p_user_wallet: userWallet,
        p_sm_balance: smBalance
      });

      if (error) {
        console.error('领取每日奖励失败:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('领取每日奖励异常:', error);
      return false;
    }
  }

  /**
   * 获取软质押配置
   */
  static async getConfig(): Promise<SoftStakingConfig | null> {
    try {
      const { data, error } = await supabase
        .from('soft_staking_config')
        .select('*')
        .single();

      if (error) {
        console.error('获取软质押配置失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('获取软质押配置异常:', error);
      return null;
    }
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStats(userWallet: string) {
    try {
      const { data, error } = await supabase.rpc('get_user_soft_staking_stats', {
        p_user_wallet: userWallet
      });

      if (error) {
        console.error('获取用户统计信息失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('获取用户统计信息异常:', error);
      return null;
    }
  }
}

export default SoftStakingService;
