/**
 * 小红花空投池数据库操作
 * 管理空投池的创建、参与、奖励分发等操作
 */

import { supabase } from '@/lib/supabase';
import { AirdropPool, AirdropParticipation } from '@/types/global';

export class AirdropPoolsDB {
  /**
   * 获取所有活跃的空投池
   */
  static async getActivePools(): Promise<AirdropPool[]> {
    try {
      const { data, error } = await supabase
        .from('airdrop_pools')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapDbToPool) || [];
    } catch (error) {
      console.error('获取空投池失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取空投池详情
   */
  static async getPoolById(poolId: string): Promise<AirdropPool | null> {
    try {
      const { data, error } = await supabase
        .from('airdrop_pools')
        .select('*')
        .eq('id', poolId)
        .single();

      if (error) throw error;

      return data ? this.mapDbToPool(data) : null;
    } catch (error) {
      console.error('获取空投池详情失败:', error);
      return null;
    }
  }

  /**
   * 创建新的空投池
   */
  static async createPool(pool: Omit<AirdropPool, 'id' | 'currentParticipants'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('airdrop_pools')
        .insert([{
          name: pool.name,
          description: pool.description,
          total_reward: pool.totalReward,
          token_type: pool.tokenType,
          entry_fee: pool.entryFee,
          max_participants: pool.maxParticipants,
          start_date: new Date(pool.startDate).toISOString(),
          end_date: new Date(pool.endDate).toISOString(),
          distribution_date: new Date(pool.distributionDate).toISOString(),
          is_active: pool.isActive,
          requirements: pool.requirements,
        }])
        .select('id')
        .single();

      if (error) throw error;

      return data?.id || null;
    } catch (error) {
      console.error('创建空投池失败:', error);
      return null;
    }
  }

  /**
   * 参与空投池
   */
  static async participateInPool(participation: Omit<AirdropParticipation, 'id' | 'participatedAt' | 'reward' | 'claimed' | 'claimedAt'>): Promise<string | null> {
    try {
      // 检查用户是否已经参与
      const { data: existing, error: checkError } = await supabase
        .from('airdrop_participations')
        .select('id')
        .eq('pool_id', participation.poolId)
        .eq('wallet_address', participation.walletAddress)
        .single();

      if (existing) {
        throw new Error('用户已经参与此空投池');
      }

      // 检查空投池是否还有名额
      const pool = await this.getPoolById(participation.poolId);
      if (!pool) {
        throw new Error('空投池不存在');
      }

      if (pool.currentParticipants >= pool.maxParticipants) {
        throw new Error('空投池已满');
      }

      // 检查用户小红花余额
      const { data: flowerBalance, error: balanceError } = await supabase
        .from('flower_balances')
        .select('available')
        .eq('wallet_address', participation.walletAddress)
        .single();

      if (balanceError || !flowerBalance || flowerBalance.available < participation.entryAmount) {
        throw new Error('小红花余额不足');
      }

      // 开始事务
      const { data, error } = await supabase
        .from('airdrop_participations')
        .insert([{
          pool_id: participation.poolId,
          user_id: participation.userId,
          wallet_address: participation.walletAddress,
          entry_amount: participation.entryAmount,
          participated_at: new Date().toISOString(),
          claimed: false,
        }])
        .select('id')
        .single();

      if (error) throw error;

      // 扣除用户小红花
      await this.deductFlowers(participation.walletAddress, participation.entryAmount, participation.poolId);

      // 更新空投池参与人数
      await this.incrementPoolParticipants(participation.poolId);

      return data?.id || null;
    } catch (error) {
      console.error('参与空投池失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的参与记录
   */
  static async getUserParticipations(walletAddress: string): Promise<AirdropParticipation[]> {
    try {
      const { data, error } = await supabase
        .from('airdrop_participations')
        .select(`
          *,
          airdrop_pools (
            name,
            token_type,
            total_reward
          )
        `)
        .eq('wallet_address', walletAddress)
        .order('participated_at', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapDbToParticipation) || [];
    } catch (error) {
      console.error('获取用户参与记录失败:', error);
      return [];
    }
  }

  /**
   * 分发空投奖励
   */
  static async distributeRewards(poolId: string): Promise<boolean> {
    try {
      // 获取空投池信息
      const pool = await this.getPoolById(poolId);
      if (!pool) {
        throw new Error('空投池不存在');
      }

      // 获取所有参与者
      const { data: participants, error: participantsError } = await supabase
        .from('airdrop_participations')
        .select('*')
        .eq('pool_id', poolId)
        .eq('claimed', false);

      if (participantsError) throw participantsError;

      if (!participants || participants.length === 0) {
        return true; // 没有参与者，直接返回成功
      }

      // 计算每个参与者的奖励
      const totalEntryAmount = participants.reduce((sum, p) => sum + p.entry_amount, 0);
      const totalReward = parseFloat(pool.totalReward);

      for (const participant of participants) {
        // 按比例分配奖励
        const rewardRatio = participant.entry_amount / totalEntryAmount;
        const reward = (totalReward * rewardRatio).toFixed(6);

        // 更新参与记录
        await supabase
          .from('airdrop_participations')
          .update({
            reward: reward,
            claimed: true,
            claimed_at: new Date().toISOString(),
          })
          .eq('id', participant.id);

        // 发放奖励
        if (pool.tokenType === 'SM') {
          // 发放SM代币（这里应该调用智能合约）
          await this.distributeSMTokens(participant.wallet_address, reward);
        } else {
          // 发放小红花
          await this.distributeFlowers(participant.wallet_address, parseInt(reward));
        }
      }

      // 标记空投池为已分发
      await supabase
        .from('airdrop_pools')
        .update({ is_active: false })
        .eq('id', poolId);

      return true;
    } catch (error) {
      console.error('分发空投奖励失败:', error);
      return false;
    }
  }

  /**
   * 扣除用户小红花
   */
  private static async deductFlowers(walletAddress: string, amount: number, poolId: string): Promise<void> {
    // 记录小红花交易
    await supabase
      .from('flower_transactions')
      .insert([{
        wallet_address: walletAddress,
        type: 'spend',
        amount: amount,
        source: 'airdrop',
        description: `参与空投池`,
        related_pool_id: poolId,
        timestamp: new Date().toISOString(),
      }]);

    // 更新余额
    await supabase.rpc('update_flower_balance', {
      user_wallet: walletAddress,
      amount_change: -amount,
      transaction_type: 'spend'
    });
  }

  /**
   * 发放小红花奖励
   */
  private static async distributeFlowers(walletAddress: string, amount: number): Promise<void> {
    // 记录小红花交易
    await supabase
      .from('flower_transactions')
      .insert([{
        wallet_address: walletAddress,
        type: 'earn',
        amount: amount,
        source: 'airdrop',
        description: `空投池奖励`,
        timestamp: new Date().toISOString(),
      }]);

    // 更新余额
    await supabase.rpc('update_flower_balance', {
      user_wallet: walletAddress,
      amount_change: amount,
      transaction_type: 'earn'
    });
  }

  /**
   * 发放SM代币奖励（模拟）
   */
  private static async distributeSMTokens(walletAddress: string, amount: string): Promise<void> {
    // 这里应该调用智能合约来发放SM代币
    // 目前只是记录日志
    console.log(`发放 ${amount} SM代币给 ${walletAddress}`);
    
    // 记录交易日志
    await supabase
      .from('token_transactions')
      .insert([{
        wallet_address: walletAddress,
        type: 'airdrop',
        amount: amount,
        token: 'SM',
        description: `空投池SM代币奖励`,
        timestamp: new Date().toISOString(),
      }]);
  }

  /**
   * 增加空投池参与人数
   */
  private static async incrementPoolParticipants(poolId: string): Promise<void> {
    await supabase.rpc('increment_pool_participants', {
      pool_id: poolId
    });
  }

  /**
   * 数据库记录转换为空投池对象
   */
  private static mapDbToPool(dbRecord: any): AirdropPool {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      description: dbRecord.description,
      totalReward: dbRecord.total_reward,
      tokenType: dbRecord.token_type,
      entryFee: dbRecord.entry_fee,
      maxParticipants: dbRecord.max_participants,
      currentParticipants: dbRecord.current_participants || 0,
      startDate: new Date(dbRecord.start_date).getTime(),
      endDate: new Date(dbRecord.end_date).getTime(),
      distributionDate: new Date(dbRecord.distribution_date).getTime(),
      isActive: dbRecord.is_active,
      requirements: dbRecord.requirements,
    };
  }

  /**
   * 数据库记录转换为参与对象
   */
  private static mapDbToParticipation(dbRecord: any): AirdropParticipation {
    return {
      id: dbRecord.id,
      poolId: dbRecord.pool_id,
      userId: dbRecord.user_id,
      walletAddress: dbRecord.wallet_address,
      entryAmount: dbRecord.entry_amount,
      participatedAt: new Date(dbRecord.participated_at).getTime(),
      reward: dbRecord.reward,
      claimed: dbRecord.claimed,
      claimedAt: dbRecord.claimed_at ? new Date(dbRecord.claimed_at).getTime() : undefined,
    };
  }
}
