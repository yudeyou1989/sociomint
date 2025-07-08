#!/usr/bin/env node

/**
 * 软质押系统定时任务脚本
 * 用于定期记录用户余额快照和计算每日奖励
 */

const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const cron = require('node-cron');

// 环境变量
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // 需要服务端密钥
const SM_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SM_TOKEN_ADDRESS;
const BSC_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

// SM Token ABI (简化版，只包含 balanceOf)
const SM_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)"
];

// 创建客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
const smTokenContract = new ethers.Contract(SM_TOKEN_ADDRESS, SM_TOKEN_ABI, provider);

/**
 * 记录单个用户的余额快照
 */
async function recordUserSnapshot(userWallet) {
  try {
    // 获取链上余额
    const balance = await smTokenContract.balanceOf(userWallet);
    const balanceFormatted = ethers.formatEther(balance);

    // 记录到数据库
    const { data, error } = await supabase.rpc('record_balance_snapshot', {
      p_user_wallet: userWallet,
      p_sm_balance: balanceFormatted
    });

    if (error) {
      console.error(`记录用户 ${userWallet} 快照失败:`, error);
      return false;
    }

    console.log(`✓ 记录用户 ${userWallet} 快照成功，余额: ${balanceFormatted} SM`);
    return true;
  } catch (error) {
    console.error(`记录用户 ${userWallet} 快照异常:`, error);
    return false;
  }
}

/**
 * 批量记录活跃用户的余额快照
 */
async function recordActiveUsersSnapshots() {
  try {
    console.log('🔄 开始记录活跃用户余额快照...');

    // 获取所有有活跃软质押会话的用户
    const { data: activeUsers, error } = await supabase
      .from('soft_staking_sessions')
      .select('user_wallet')
      .is('end_time', null);

    if (error) {
      console.error('获取活跃用户失败:', error);
      return;
    }

    if (!activeUsers || activeUsers.length === 0) {
      console.log('📭 没有活跃的软质押用户');
      return;
    }

    // 去重
    const uniqueWallets = [...new Set(activeUsers.map(u => u.user_wallet))];
    console.log(`📊 找到 ${uniqueWallets.length} 个活跃用户`);

    // 批量处理，每次处理10个用户
    const batchSize = 10;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < uniqueWallets.length; i += batchSize) {
      const batch = uniqueWallets.slice(i, i + batchSize);
      
      const promises = batch.map(wallet => recordUserSnapshot(wallet));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successCount++;
        } else {
          failCount++;
          console.error(`批次处理失败 ${batch[index]}:`, result.reason);
        }
      });

      // 避免请求过于频繁
      if (i + batchSize < uniqueWallets.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ 快照任务完成: 成功 ${successCount}, 失败 ${failCount}`);
  } catch (error) {
    console.error('❌ 记录活跃用户快照失败:', error);
  }
}

/**
 * 计算和记录每日奖励
 */
async function calculateDailyRewards() {
  try {
    console.log('🔄 开始计算每日奖励...');

    // 获取昨天的日期
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 获取所有符合条件的用户
    const { data: eligibleUsers, error } = await supabase
      .from('soft_staking_sessions')
      .select('user_wallet')
      .eq('is_eligible_for_reward', true)
      .lte('start_time', `${yesterdayStr} 23:59:59`);

    if (error) {
      console.error('获取符合条件的用户失败:', error);
      return;
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      console.log('📭 没有符合条件的用户');
      return;
    }

    const uniqueWallets = [...new Set(eligibleUsers.map(u => u.user_wallet))];
    console.log(`📊 找到 ${uniqueWallets.length} 个符合条件的用户`);

    let rewardCount = 0;
    let skipCount = 0;

    for (const wallet of uniqueWallets) {
      try {
        // 检查是否已经计算过奖励
        const { data: existingReward } = await supabase
          .from('soft_staking_rewards')
          .select('id')
          .eq('user_wallet', wallet)
          .eq('reward_date', yesterdayStr)
          .single();

        if (existingReward) {
          skipCount++;
          continue;
        }

        // 计算奖励
        const { data: rewardAmount, error: calcError } = await supabase.rpc('calculate_soft_staking_reward', {
          p_user_wallet: wallet,
          p_reward_date: yesterdayStr
        });

        if (calcError) {
          console.error(`计算用户 ${wallet} 奖励失败:`, calcError);
          continue;
        }

        if (parseFloat(rewardAmount) > 0) {
          // 获取24小时最低余额
          const { data: minBalance } = await supabase.rpc('get_user_24h_min_balance', {
            p_user_wallet: wallet,
            p_check_time: `${yesterdayStr} 23:59:59`
          });

          // 记录奖励
          const { error: insertError } = await supabase
            .from('soft_staking_rewards')
            .insert({
              user_wallet: wallet,
              reward_date: yesterdayStr,
              sm_balance: minBalance || '0',
              flowers_amount: rewardAmount,
              calculation_method: 'minimum_balance',
              is_distributed: false
            });

          if (insertError) {
            console.error(`记录用户 ${wallet} 奖励失败:`, insertError);
          } else {
            console.log(`✓ 记录用户 ${wallet} 奖励: ${rewardAmount} 小红花`);
            rewardCount++;
          }
        }
      } catch (error) {
        console.error(`处理用户 ${wallet} 奖励异常:`, error);
      }
    }

    console.log(`✅ 每日奖励计算完成: 新增 ${rewardCount}, 跳过 ${skipCount}`);
  } catch (error) {
    console.error('❌ 计算每日奖励失败:', error);
  }
}

/**
 * 清理过期数据
 */
async function cleanupOldData() {
  try {
    console.log('🔄 开始清理过期数据...');

    // 删除30天前的余额快照
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error: snapshotError } = await supabase
      .from('user_balance_snapshots')
      .delete()
      .lt('snapshot_time', thirtyDaysAgo.toISOString());

    if (snapshotError) {
      console.error('清理余额快照失败:', snapshotError);
    } else {
      console.log('✓ 清理30天前的余额快照完成');
    }

    // 删除90天前的奖励记录
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { error: rewardError } = await supabase
      .from('soft_staking_rewards')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (rewardError) {
      console.error('清理奖励记录失败:', rewardError);
    } else {
      console.log('✓ 清理90天前的奖励记录完成');
    }

    console.log('✅ 数据清理完成');
  } catch (error) {
    console.error('❌ 清理过期数据失败:', error);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 软质押定时任务启动');

  // 验证环境变量
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SM_TOKEN_ADDRESS || !BSC_RPC_URL) {
    console.error('❌ 缺少必要的环境变量');
    process.exit(1);
  }

  // 每小时记录余额快照 (分钟 0)
  cron.schedule('0 * * * *', async () => {
    console.log(`\n⏰ [${new Date().toISOString()}] 执行每小时快照任务`);
    await recordActiveUsersSnapshots();
  });

  // 每天凌晨2点计算前一天的奖励
  cron.schedule('0 2 * * *', async () => {
    console.log(`\n⏰ [${new Date().toISOString()}] 执行每日奖励计算任务`);
    await calculateDailyRewards();
  });

  // 每周日凌晨3点清理过期数据
  cron.schedule('0 3 * * 0', async () => {
    console.log(`\n⏰ [${new Date().toISOString()}] 执行数据清理任务`);
    await cleanupOldData();
  });

  console.log('📅 定时任务已设置:');
  console.log('  - 每小时记录余额快照');
  console.log('  - 每天凌晨2点计算奖励');
  console.log('  - 每周日凌晨3点清理数据');
  console.log('🎯 任务运行中...\n');

  // 立即执行一次快照任务（可选）
  if (process.argv.includes('--immediate')) {
    console.log('🔄 立即执行快照任务...');
    await recordActiveUsersSnapshots();
  }
}

// 优雅退出处理
process.on('SIGINT', () => {
  console.log('\n👋 收到退出信号，正在关闭定时任务...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 收到终止信号，正在关闭定时任务...');
  process.exit(0);
});

// 启动
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 启动定时任务失败:', error);
    process.exit(1);
  });
}

module.exports = {
  recordActiveUsersSnapshots,
  calculateDailyRewards,
  cleanupOldData
};
