/**
 * 每日限量兑换服务
 * 实现每日50万SM的限量兑换机制，包括兑换池管理、用户限额、动态比例调整
 */

import { createClient } from '@supabase/supabase-js';

// 环境变量
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface DailyExchangePool {
  id: string;
  pool_date: string;
  total_sm_available: string;
  sm_exchanged: string;
  sm_remaining: string;
  base_exchange_rate: string;
  current_exchange_rate: string;
  rate_adjustment_factor: string;
  total_participants: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRecord {
  id: string;
  user_wallet: string;
  pool_date: string;
  flowers_amount: string;
  sm_amount: string;
  exchange_rate: string;
  transaction_hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  confirmed_at?: string;
}

export interface UserExchangeLimit {
  user_tier: 'basic' | 'verified' | 'vip';
  min_flowers_per_exchange: string;
  max_flowers_per_day: string;
  max_sm_per_day: string;
  bonus_rate_multiplier: string;
}

export interface ExchangeEligibility {
  eligible: boolean;
  reason?: string;
  required_sm?: string;
  exchange_rate?: string;
  bonus_multiplier?: string;
  min_required?: string;
  max_allowed?: string;
  available_sm?: string;
}

export interface ExchangeResult {
  success: boolean;
  record_id?: string;
  sm_amount?: string;
  exchange_rate?: string;
  new_rate?: string;
  error?: string;
}

export class DailyExchangeService {
  /**
   * 获取或创建当日兑换池
   */
  static async getOrCreateDailyPool(poolDate?: string): Promise<string | null> {
    try {
      const date = poolDate || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('get_or_create_daily_pool', {
        p_pool_date: date
      });

      if (error) {
        console.error('获取或创建兑换池失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('获取或创建兑换池异常:', error);
      return null;
    }
  }

  /**
   * 获取当日兑换池信息
   */
  static async getDailyPool(poolDate?: string): Promise<DailyExchangePool | null> {
    try {
      const date = poolDate || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_exchange_pools')
        .select('*')
        .eq('pool_date', date)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('获取兑换池信息失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('获取兑换池信息异常:', error);
      return null;
    }
  }

  /**
   * 计算动态兑换比例
   */
  static async calculateDynamicRate(poolDate?: string): Promise<string> {
    try {
      const date = poolDate || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('calculate_dynamic_exchange_rate', {
        p_pool_date: date
      });

      if (error) {
        console.error('计算动态兑换比例失败:', error);
        return '100'; // 默认比例
      }

      return data || '100';
    } catch (error) {
      console.error('计算动态兑换比例异常:', error);
      return '100';
    }
  }

  /**
   * 检查用户兑换资格
   */
  static async checkEligibility(
    userWallet: string,
    flowersAmount: string,
    poolDate?: string
  ): Promise<ExchangeEligibility> {
    try {
      const date = poolDate || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('check_user_exchange_eligibility', {
        p_user_wallet: userWallet,
        p_flowers_amount: flowersAmount,
        p_pool_date: date
      });

      if (error) {
        console.error('检查兑换资格失败:', error);
        return { eligible: false, reason: 'check_failed' };
      }

      return data || { eligible: false, reason: 'unknown_error' };
    } catch (error) {
      console.error('检查兑换资格异常:', error);
      return { eligible: false, reason: 'exception' };
    }
  }

  /**
   * 执行兑换操作
   */
  static async executeExchange(
    userWallet: string,
    flowersAmount: string,
    transactionHash?: string,
    poolDate?: string
  ): Promise<ExchangeResult> {
    try {
      const date = poolDate || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('execute_daily_exchange', {
        p_user_wallet: userWallet,
        p_flowers_amount: flowersAmount,
        p_transaction_hash: transactionHash,
        p_pool_date: date
      });

      if (error) {
        console.error('执行兑换失败:', error);
        return { success: false, error: error.message };
      }

      if (data && data.success) {
        return {
          success: true,
          record_id: data.record_id,
          sm_amount: data.sm_amount,
          exchange_rate: data.exchange_rate,
          new_rate: data.new_rate
        };
      } else {
        return { 
          success: false, 
          error: data?.reason || 'unknown_error' 
        };
      }
    } catch (error) {
      console.error('执行兑换异常:', error);
      return { success: false, error: 'exception' };
    }
  }

  /**
   * 获取用户兑换记录
   */
  static async getUserExchangeRecords(
    userWallet: string,
    limit: number = 30
  ): Promise<ExchangeRecord[]> {
    try {
      const { data, error } = await supabase
        .from('daily_exchange_records')
        .select('*')
        .eq('user_wallet', userWallet)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取用户兑换记录失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取用户兑换记录异常:', error);
      return [];
    }
  }

  /**
   * 获取用户今日兑换记录
   */
  static async getUserTodayExchange(
    userWallet: string,
    poolDate?: string
  ): Promise<ExchangeRecord | null> {
    try {
      const date = poolDate || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_exchange_records')
        .select('*')
        .eq('user_wallet', userWallet)
        .eq('pool_date', date)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('获取用户今日兑换记录失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('获取用户今日兑换记录异常:', error);
      return null;
    }
  }

  /**
   * 获取兑换比例历史
   */
  static async getExchangeRateHistory(
    poolDate?: string,
    limit: number = 24
  ): Promise<any[]> {
    try {
      const date = poolDate || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('exchange_rate_history')
        .select('*')
        .eq('pool_date', date)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取兑换比例历史失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取兑换比例历史异常:', error);
      return [];
    }
  }

  /**
   * 获取用户兑换限额
   */
  static async getUserExchangeLimit(
    userTier: 'basic' | 'verified' | 'vip' = 'basic'
  ): Promise<UserExchangeLimit | null> {
    try {
      const { data, error } = await supabase
        .from('user_exchange_limits')
        .select('*')
        .eq('user_tier', userTier)
        .eq('is_active', true)
        .lte('effective_date', new Date().toISOString().split('T')[0])
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('获取用户兑换限额失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('获取用户兑换限额异常:', error);
      return null;
    }
  }

  /**
   * 获取兑换统计信息
   */
  static async getExchangeStats(poolDate?: string) {
    try {
      const date = poolDate || new Date().toISOString().split('T')[0];
      
      const [pool, rateHistory] = await Promise.all([
        this.getDailyPool(date),
        this.getExchangeRateHistory(date, 1)
      ]);

      if (!pool) {
        return null;
      }

      // 计算统计数据
      const utilizationRate = parseFloat(pool.sm_exchanged) / parseFloat(pool.total_sm_available);
      const remainingPercentage = (parseFloat(pool.sm_remaining) / parseFloat(pool.total_sm_available)) * 100;
      
      // 预估完售时间（基于当前兑换速度）
      const hoursElapsed = (new Date().getTime() - new Date(pool.created_at).getTime()) / (1000 * 60 * 60);
      const exchangeRate = hoursElapsed > 0 ? parseFloat(pool.sm_exchanged) / hoursElapsed : 0;
      const estimatedHoursToSellOut = exchangeRate > 0 ? parseFloat(pool.sm_remaining) / exchangeRate : 0;

      return {
        pool,
        utilizationRate,
        remainingPercentage,
        estimatedHoursToSellOut,
        currentRate: pool.current_exchange_rate,
        rateChanges: rateHistory.length,
        avgParticipation: pool.total_participants > 0 ? parseFloat(pool.sm_exchanged) / pool.total_participants : 0
      };
    } catch (error) {
      console.error('获取兑换统计失败:', error);
      return null;
    }
  }

  /**
   * 更新兑换记录状态
   */
  static async updateExchangeStatus(
    recordId: string,
    status: 'confirmed' | 'failed',
    transactionHash?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null
      };

      if (transactionHash) {
        updateData.transaction_hash = transactionHash;
      }

      const { error } = await supabase
        .from('daily_exchange_records')
        .update(updateData)
        .eq('id', recordId);

      if (error) {
        console.error('更新兑换记录状态失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('更新兑换记录状态异常:', error);
      return false;
    }
  }

  /**
   * 获取热门兑换数据（用于展示）
   */
  static async getPopularExchangeData(days: number = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('daily_exchange_pools')
        .select('pool_date, total_sm_available, sm_exchanged, total_participants, current_exchange_rate')
        .gte('pool_date', startDate.toISOString().split('T')[0])
        .lte('pool_date', endDate.toISOString().split('T')[0])
        .order('pool_date', { ascending: true });

      if (error) {
        console.error('获取热门兑换数据失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取热门兑换数据异常:', error);
      return [];
    }
  }

  /**
   * 预估兑换结果
   */
  static async estimateExchange(
    userWallet: string,
    flowersAmount: string,
    poolDate?: string
  ) {
    try {
      const eligibility = await this.checkEligibility(userWallet, flowersAmount, poolDate);

      if (!eligibility.eligible) {
        return {
          success: false,
          ...eligibility
        };
      }

      const pool = await this.getDailyPool(poolDate);
      if (!pool) {
        return {
          success: false,
          reason: 'pool_not_found'
        };
      }

      return {
        success: true,
        estimatedSM: eligibility.required_sm,
        currentRate: eligibility.exchange_rate,
        bonusMultiplier: eligibility.bonus_multiplier,
        poolRemaining: pool.sm_remaining,
        utilizationRate: (parseFloat(pool.sm_exchanged) / parseFloat(pool.total_sm_available)) * 100
      };
    } catch (error) {
      console.error('预估兑换结果异常:', error);
      return {
        success: false,
        reason: 'estimation_failed'
      };
    }
  }
}

export default DailyExchangeService;
