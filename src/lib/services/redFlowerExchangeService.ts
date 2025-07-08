/**
 * 小红花兑换服务（升级版）
 * 实现动态兑换比例、分层奖励、每日限额等新功能
 */

import { createClient } from '@supabase/supabase-js';

// 环境变量
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface RedFlowerBalance {
  id: string;
  user_wallet: string;
  available_balance: string;
  locked_balance: string;
  total_earned: string;
  total_spent: string;
  last_updated: string;
}

export interface RedFlowerTransaction {
  id: string;
  user_wallet: string;
  transaction_type: 'earn' | 'spend' | 'lock' | 'unlock' | 'transfer';
  amount: string;
  balance_before: string;
  balance_after: string;
  source_type: 'daily_reward' | 'social_task' | 'airdrop' | 'exchange' | 'manual' | 'soft_staking';
  source_id?: string;
  description: string;
  metadata?: any;
  tx_hash?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  confirmed_at?: string;
}

export interface UserTier {
  user_wallet: string;
  tier_level: 'basic' | 'verified' | 'vip' | 'premium';
  tier_points: number;
  social_verifications: any;
  kyc_status: 'none' | 'pending' | 'verified' | 'rejected';
  referral_count: number;
  total_sm_held: string;
  tier_updated_at: string;
}

export interface ExchangeConfig {
  min_exchange_amount: string;
  max_daily_exchange: string;
  base_exchange_rate: string;
  bonus_multiplier: string;
  fee_percentage: string;
}

export interface ExchangeResult {
  success: boolean;
  transaction_id?: string;
  sm_amount?: string;
  exchange_rate?: string;
  fee_amount?: string;
  net_flowers?: string;
  bonus_multiplier?: string;
  error?: string;
  min_required?: string;
  daily_limit?: string;
  already_exchanged?: string;
}

export interface DailyExchangeStats {
  stat_date: string;
  user_wallet: string;
  flowers_exchanged: string;
  sm_received: string;
  exchange_count: number;
  average_rate: string;
  total_fees: string;
}

export class RedFlowerExchangeService {
  /**
   * 获取用户小红花余额
   */
  static async getUserBalance(userWallet: string): Promise<RedFlowerBalance | null> {
    try {
      // 先确保用户余额记录存在
      await supabase.rpc('get_or_create_red_flower_balance', {
        p_user_wallet: userWallet
      });

      const { data, error } = await supabase
        .from('red_flower_balances')
        .select('*')
        .eq('user_wallet', userWallet)
        .single();

      if (error) {
        console.error('获取用户小红花余额失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('获取用户小红花余额异常:', error);
      return null;
    }
  }

  /**
   * 获取用户等级信息
   */
  static async getUserTier(userWallet: string): Promise<UserTier | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_tier_info', {
        p_user_wallet: userWallet
      });

      if (error) {
        console.error('获取用户等级信息失败:', error);
        return null;
      }

      if (data && data.length > 0) {
        return {
          user_wallet: userWallet,
          tier_level: data[0].tier_level,
          tier_points: data[0].tier_points,
          social_verifications: data[0].social_verifications,
          kyc_status: data[0].kyc_status,
          referral_count: 0,
          total_sm_held: '0',
          tier_updated_at: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('获取用户等级信息异常:', error);
      return null;
    }
  }

  /**
   * 获取用户兑换配置
   */
  static async getUserExchangeConfig(userWallet: string): Promise<ExchangeConfig | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_exchange_config', {
        p_user_wallet: userWallet
      });

      if (error) {
        console.error('获取用户兑换配置失败:', error);
        return null;
      }

      if (data && data.length > 0) {
        return data[0];
      }

      return null;
    } catch (error) {
      console.error('获取用户兑换配置异常:', error);
      return null;
    }
  }

  /**
   * 执行小红花兑换
   */
  static async executeExchange(
    userWallet: string,
    flowersAmount: string,
    description?: string
  ): Promise<ExchangeResult> {
    try {
      const { data, error } = await supabase.rpc('execute_red_flower_exchange', {
        p_user_wallet: userWallet,
        p_flowers_amount: flowersAmount,
        p_description: description
      });

      if (error) {
        console.error('执行小红花兑换失败:', error);
        return { success: false, error: error.message };
      }

      return data || { success: false, error: 'unknown_error' };
    } catch (error) {
      console.error('执行小红花兑换异常:', error);
      return { success: false, error: 'exception' };
    }
  }

  /**
   * 添加小红花余额
   */
  static async addBalance(
    userWallet: string,
    amount: string,
    sourceType: 'daily_reward' | 'social_task' | 'airdrop' | 'manual' | 'soft_staking',
    sourceId?: string,
    description?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('add_red_flower_balance', {
        p_user_wallet: userWallet,
        p_amount: amount,
        p_source_type: sourceType,
        p_source_id: sourceId,
        p_description: description
      });

      if (error) {
        console.error('添加小红花余额失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('添加小红花余额异常:', error);
      return null;
    }
  }

  /**
   * 获取用户交易记录
   */
  static async getUserTransactions(
    userWallet: string,
    limit: number = 50,
    transactionType?: string
  ): Promise<RedFlowerTransaction[]> {
    try {
      let query = supabase
        .from('red_flower_transactions')
        .select('*')
        .eq('user_wallet', userWallet)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (transactionType) {
        query = query.eq('transaction_type', transactionType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('获取用户交易记录失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取用户交易记录异常:', error);
      return [];
    }
  }

  /**
   * 获取用户每日兑换统计
   */
  static async getUserDailyStats(
    userWallet: string,
    statDate?: string
  ): Promise<DailyExchangeStats | null> {
    try {
      const date = statDate || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_exchange_stats')
        .select('*')
        .eq('user_wallet', userWallet)
        .eq('stat_date', date)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('获取用户每日统计失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('获取用户每日统计异常:', error);
      return null;
    }
  }

  /**
   * 升级用户等级
   */
  static async upgradeUserTier(
    userWallet: string,
    newTier: 'basic' | 'verified' | 'vip' | 'premium',
    reason?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('upgrade_user_tier', {
        p_user_wallet: userWallet,
        p_new_tier: newTier,
        p_reason: reason
      });

      if (error) {
        console.error('升级用户等级失败:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('升级用户等级异常:', error);
      return false;
    }
  }

  /**
   * 获取兑换预估
   */
  static async getExchangeEstimate(
    userWallet: string,
    flowersAmount: string
  ) {
    try {
      const [balance, config, dailyStats] = await Promise.all([
        this.getUserBalance(userWallet),
        this.getUserExchangeConfig(userWallet),
        this.getUserDailyStats(userWallet)
      ]);

      if (!balance || !config) {
        return {
          success: false,
          error: 'user_data_not_found'
        };
      }

      const amount = parseFloat(flowersAmount);
      
      // 检查余额
      if (amount > parseFloat(balance.available_balance)) {
        return {
          success: false,
          error: 'insufficient_balance',
          available_balance: balance.available_balance
        };
      }

      // 检查最小兑换数量
      if (amount < parseFloat(config.min_exchange_amount)) {
        return {
          success: false,
          error: 'below_minimum',
          min_required: config.min_exchange_amount
        };
      }

      // 检查每日限额
      const todayExchanged = dailyStats ? parseFloat(dailyStats.flowers_exchanged) : 0;
      if (todayExchanged + amount > parseFloat(config.max_daily_exchange)) {
        return {
          success: false,
          error: 'exceeds_daily_limit',
          daily_limit: config.max_daily_exchange,
          already_exchanged: todayExchanged.toString()
        };
      }

      // 计算预估结果
      const actualRate = parseFloat(config.base_exchange_rate) / parseFloat(config.bonus_multiplier);
      const feeAmount = amount * parseFloat(config.fee_percentage) / 100;
      const netFlowers = amount - feeAmount;
      const smAmount = netFlowers / actualRate;

      return {
        success: true,
        estimated_sm: smAmount.toString(),
        exchange_rate: actualRate.toString(),
        fee_amount: feeAmount.toString(),
        net_flowers: netFlowers.toString(),
        bonus_multiplier: config.bonus_multiplier,
        remaining_daily_limit: (parseFloat(config.max_daily_exchange) - todayExchanged).toString()
      };
    } catch (error) {
      console.error('获取兑换预估异常:', error);
      return {
        success: false,
        error: 'estimation_failed'
      };
    }
  }

  /**
   * 获取用户完整信息
   */
  static async getUserInfo(userWallet: string) {
    try {
      const [balance, tier, config, dailyStats, recentTransactions] = await Promise.all([
        this.getUserBalance(userWallet),
        this.getUserTier(userWallet),
        this.getUserExchangeConfig(userWallet),
        this.getUserDailyStats(userWallet),
        this.getUserTransactions(userWallet, 10)
      ]);

      return {
        balance,
        tier,
        config,
        dailyStats,
        recentTransactions,
        summary: {
          canExchange: balance && parseFloat(balance.available_balance) > 0,
          tierLevel: tier?.tier_level || 'basic',
          dailyRemaining: config && dailyStats 
            ? (parseFloat(config.max_daily_exchange) - parseFloat(dailyStats.flowers_exchanged || '0')).toString()
            : config?.max_daily_exchange || '0'
        }
      };
    } catch (error) {
      console.error('获取用户完整信息异常:', error);
      return null;
    }
  }
}

export default RedFlowerExchangeService;
