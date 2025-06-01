/**
 * Telegram Bot 每日奖励功能模块
 * 支持查看奖励状态、领取奖励、排行榜等功能
 */

import { Telegraf, Context, Markup } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import type { Database } from '@/types/supabase';

// 环境变量
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SM_TOKEN_EXCHANGE_ADDRESS = process.env.NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS!;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

// 初始化客户端
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const provider = new ethers.JsonRpcProvider(RPC_URL);

// 合约 ABI
const SM_TOKEN_EXCHANGE_ABI = [
  'function getUserDailyRewardInfo(address user) view returns (uint256 smBalance, uint256 dailyFlowers, bool canClaim, uint256 nextClaimTime, uint256 totalClaimed)',
  'function getDailyRewardConfig() view returns (uint256 flowersPer500Sm, uint256 maxDailyFlowersPerUser, uint256 dailyClaimInterval)',
  'function claimDailyFlowers() external'
];

// 创建合约实例
const smTokenExchange = new ethers.Contract(SM_TOKEN_EXCHANGE_ADDRESS, SM_TOKEN_EXCHANGE_ABI, provider);

// 扩展 Context 类型
interface BotContext extends Context {
  session?: {
    walletAddress?: string;
    userId?: string;
  };
}

// 创建 Bot 实例
export const dailyRewardBot = new Telegraf<BotContext>(TELEGRAM_BOT_TOKEN);

// 辅助函数：格式化数字
function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

// 辅助函数：格式化时间
function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '现在可以领取';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  return `${minutes}分钟`;
}

// 辅助函数：获取用户钱包地址
async function getUserWallet(telegramUsername: string): Promise<string | null> {
  const { data: user } = await supabase
    .from('user_profiles')
    .select('wallet_address')
    .eq('telegram_username', telegramUsername)
    .single();
  
  return user?.wallet_address || null;
}

// 命令：/daily - 查看每日奖励状态
dailyRewardBot.command('daily', async (ctx) => {
  try {
    const telegramUsername = ctx.from?.username;
    if (!telegramUsername) {
      await ctx.reply('❌ 请先设置 Telegram 用户名');
      return;
    }
    
    const walletAddress = await getUserWallet(telegramUsername);
    if (!walletAddress) {
      await ctx.reply('❌ 请先在 SocioMint 网站绑定您的钱包地址', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 绑定钱包', url: 'https://sociomint.com/profile' }]
          ]
        }
      });
      return;
    }
    
    // 获取用户每日奖励信息
    const rewardInfo = await smTokenExchange.getUserDailyRewardInfo(walletAddress);
    const [smBalance, dailyFlowers, canClaim, nextClaimTime, totalClaimed] = rewardInfo;
    
    const smBalanceFormatted = parseFloat(ethers.formatEther(smBalance));
    const dailyFlowersNum = Number(dailyFlowers);
    const nextClaimTimeNum = Number(nextClaimTime);
    const totalClaimedNum = Number(totalClaimed);
    
    // 计算倒计时
    const now = Math.floor(Date.now() / 1000);
    const remaining = nextClaimTimeNum - now;
    
    // 检查数据库中是否已领取
    const { data: dbCanClaim } = await supabase.rpc('can_claim_daily_reward', {
      p_user_wallet: walletAddress,
      p_claim_date: new Date().toISOString().split('T')[0]
    });
    
    const actualCanClaim = canClaim && dbCanClaim;
    
    const statusMessage = `
🌸 **每日持币奖励状态**

💰 **SM 余额**: ${formatNumber(smBalanceFormatted)} SM
🌺 **今日可领取**: ${dailyFlowersNum} 小红花
📊 **累计已领取**: ${formatNumber(totalClaimedNum)} 小红花

⏰ **状态**: ${actualCanClaim ? '✅ 可以领取' : '⏳ ' + formatTimeRemaining(remaining)}

💡 **奖励规则**: 每持有 500 SM 代币可获得 10 朵小红花
📈 **最大奖励**: 每日最多 200 朵小红花（需持有 10,000 SM）
`;

    const keyboard = [];
    
    if (actualCanClaim && dailyFlowersNum > 0) {
      keyboard.push([{ text: '🌸 领取奖励', callback_data: 'claim_daily_reward' }]);
    }
    
    keyboard.push(
      [{ text: '📊 查看排行榜', callback_data: 'daily_leaderboard' }],
      [{ text: '📈 我的统计', callback_data: 'my_daily_stats' }],
      [{ text: '🔄 刷新状态', callback_data: 'refresh_daily_status' }]
    );
    
    await ctx.reply(statusMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
    
  } catch (error) {
    console.error('Daily status error:', error);
    await ctx.reply('❌ 获取每日奖励状态失败，请稍后重试');
  }
});

// 命令：/claim_daily - 领取每日奖励
dailyRewardBot.command('claim_daily', async (ctx) => {
  try {
    const telegramUsername = ctx.from?.username;
    if (!telegramUsername) {
      await ctx.reply('❌ 请先设置 Telegram 用户名');
      return;
    }
    
    const walletAddress = await getUserWallet(telegramUsername);
    if (!walletAddress) {
      await ctx.reply('❌ 请先在 SocioMint 网站绑定您的钱包地址');
      return;
    }
    
    // 检查是否可以领取
    const rewardInfo = await smTokenExchange.getUserDailyRewardInfo(walletAddress);
    const [smBalance, dailyFlowers, canClaim] = rewardInfo;
    
    const { data: dbCanClaim } = await supabase.rpc('can_claim_daily_reward', {
      p_user_wallet: walletAddress,
      p_claim_date: new Date().toISOString().split('T')[0]
    });
    
    if (!canClaim || !dbCanClaim) {
      await ctx.reply('❌ 您今日已领取过奖励或暂时无法领取');
      return;
    }
    
    if (Number(dailyFlowers) === 0) {
      await ctx.reply('❌ 您当前没有可领取的奖励，请先持有 SM 代币');
      return;
    }
    
    // 生成领取链接
    const claimUrl = `https://sociomint.com/daily-reward?action=claim&from=telegram`;
    
    await ctx.reply(`
🌸 **确认领取每日奖励**

💰 **可领取数量**: ${Number(dailyFlowers)} 小红花
📊 **基于持币**: ${formatNumber(parseFloat(ethers.formatEther(smBalance)))} SM

请点击下方按钮前往网站完成领取：
`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌸 前往领取', url: claimUrl }],
          [{ text: '📊 查看状态', callback_data: 'refresh_daily_status' }]
        ]
      }
    });
    
  } catch (error) {
    console.error('Claim daily reward error:', error);
    await ctx.reply('❌ 处理领取请求失败，请稍后重试');
  }
});

// 回调查询：领取每日奖励
dailyRewardBot.action('claim_daily_reward', async (ctx) => {
  await ctx.answerCbQuery();
  
  // 重用 claim_daily 命令的逻辑
  const telegramUsername = ctx.from?.username;
  if (!telegramUsername) {
    await ctx.reply('❌ 请先设置 Telegram 用户名');
    return;
  }
  
  const walletAddress = await getUserWallet(telegramUsername);
  if (!walletAddress) {
    await ctx.reply('❌ 请先在 SocioMint 网站绑定您的钱包地址');
    return;
  }
  
  const claimUrl = `https://sociomint.com/daily-reward?action=claim&from=telegram`;
  await ctx.reply('🌸 请前往网站完成奖励领取', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🌸 前往领取', url: claimUrl }]
      ]
    }
  });
});

// 回调查询：查看排行榜
dailyRewardBot.action('daily_leaderboard', async (ctx) => {
  await ctx.answerCbQuery();
  
  try {
    // 获取今日排行榜
    const { data: leaderboard } = await supabase
      .from('current_daily_leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .limit(20);
    
    if (!leaderboard || leaderboard.length === 0) {
      await ctx.reply('📊 今日暂无排行榜数据');
      return;
    }
    
    const leaderboardText = leaderboard.map((entry, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      const username = entry.username || `${entry.user_wallet.slice(0, 6)}...${entry.user_wallet.slice(-4)}`;
      const flowers = formatNumber(parseFloat(entry.flowers_claimed || '0'));
      const smBalance = formatNumber(parseFloat(entry.sm_balance || '0'));
      
      return `${medal} ${username}\n   🌸 ${flowers} | 💰 ${smBalance} SM`;
    }).join('\n\n');
    
    await ctx.reply(`
🏆 **今日每日奖励排行榜 Top 20**

${leaderboardText}

💡 持有更多 SM 代币获得更多每日奖励！
`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌸 查看我的状态', callback_data: 'refresh_daily_status' }],
          [{ text: '💰 购买 SM 代币', url: 'https://sociomint.com/exchange' }]
        ]
      }
    });
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    await ctx.reply('❌ 获取排行榜失败，请稍后重试');
  }
});

// 回调查询：我的统计
dailyRewardBot.action('my_daily_stats', async (ctx) => {
  await ctx.answerCbQuery();
  
  try {
    const telegramUsername = ctx.from?.username;
    if (!telegramUsername) {
      await ctx.reply('❌ 请先设置 Telegram 用户名');
      return;
    }
    
    const walletAddress = await getUserWallet(telegramUsername);
    if (!walletAddress) {
      await ctx.reply('❌ 请先在 SocioMint 网站绑定您的钱包地址');
      return;
    }
    
    // 获取用户统计数据
    const { data: stats } = await supabase
      .from('user_daily_reward_details')
      .select('*')
      .eq('user_wallet', walletAddress)
      .single();
    
    if (!stats) {
      await ctx.reply('📊 您还没有每日奖励记录，快去领取吧！');
      return;
    }
    
    // 获取用户连续天数
    const { data: streak } = await supabase.rpc('get_user_streak', {
      p_user_wallet: walletAddress
    });
    
    const statsMessage = `
📊 **我的每日奖励统计**

🌸 **总领取次数**: ${stats.total_claims} 次
💰 **总奖励**: ${formatNumber(parseFloat(stats.total_flowers_claimed || '0'))} 小红花
📅 **首次领取**: ${stats.first_claim_date ? new Date(stats.first_claim_date).toLocaleDateString() : '未知'}
📅 **最近领取**: ${stats.last_claim_date ? new Date(stats.last_claim_date).toLocaleDateString() : '未知'}

🔥 **当前连续**: ${stats.current_streak} 天
🏆 **最长连续**: ${stats.max_streak} 天
📈 **平均每日**: ${parseFloat(stats.average_daily_flowers || '0').toFixed(1)} 小红花

🎯 **今日状态**: ${stats.claimed_today ? '✅ 已领取' : '⏳ 未领取'}
📊 **连续状态**: ${stats.streak_status === 'active' ? '🔥 进行中' : stats.streak_status === 'can_continue' ? '⚡ 可继续' : '💔 已中断'}
`;

    await ctx.reply(statsMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌸 领取今日奖励', callback_data: 'claim_daily_reward' }],
          [{ text: '🏆 查看排行榜', callback_data: 'daily_leaderboard' }]
        ]
      }
    });
    
  } catch (error) {
    console.error('User stats error:', error);
    await ctx.reply('❌ 获取统计数据失败，请稍后重试');
  }
});

// 回调查询：刷新状态
dailyRewardBot.action('refresh_daily_status', async (ctx) => {
  await ctx.answerCbQuery('🔄 正在刷新...');
  
  // 重用 daily 命令的逻辑
  const telegramUsername = ctx.from?.username;
  if (!telegramUsername) {
    await ctx.reply('❌ 请先设置 Telegram 用户名');
    return;
  }
  
  // 调用 daily 命令逻辑
  await ctx.scene.enter('daily');
});

// 定时推送：每日排行榜（每天晚上8点）
export async function sendDailyLeaderboardNotification() {
  try {
    // 获取所有绑定 Telegram 的用户
    const { data: users } = await supabase
      .from('user_profiles')
      .select('telegram_username')
      .not('telegram_username', 'is', null);
    
    if (!users || users.length === 0) return;
    
    // 获取今日排行榜 Top 10
    const { data: leaderboard } = await supabase
      .from('current_daily_leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .limit(10);
    
    if (!leaderboard || leaderboard.length === 0) return;
    
    // 获取今日统计
    const { data: todayStats } = await supabase
      .from('daily_reward_overview')
      .select('*')
      .eq('claim_date', new Date().toISOString().split('T')[0])
      .single();
    
    const message = `
🏆 **今日每日奖励排行榜**

${leaderboard.map((entry, index) => {
  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
  const username = entry.username || 'Anonymous';
  const flowers = formatNumber(parseFloat(entry.flowers_claimed || '0'));
  return `${medal} ${username}: ${flowers} 🌸`;
}).join('\n')}

📊 **今日统计**
👥 参与人数: ${todayStats?.total_claimers || 0}
🌸 总发放: ${formatNumber(parseFloat(todayStats?.total_flowers_distributed || '0'))} 小红花
📈 平均奖励: ${parseFloat(todayStats?.average_flowers_per_user || '0').toFixed(1)} 小红花

🎯 明天继续持有 SM 代币，获得更多奖励！
`;

    // 发送给前100个用户（避免频率限制）
    for (const user of users.slice(0, 100)) {
      try {
        await dailyRewardBot.telegram.sendMessage(user.telegram_username, message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌸 查看我的状态', callback_data: 'refresh_daily_status' }],
              [{ text: '💰 购买 SM 代币', url: 'https://sociomint.com/exchange' }]
            ]
          }
        });
        await new Promise(resolve => setTimeout(resolve, 100)); // 避免频率限制
      } catch (error) {
        console.error(`发送消息给 ${user.telegram_username} 失败:`, error);
      }
    }
    
  } catch (error) {
    console.error('发送每日排行榜失败:', error);
  }
}

// 定时推送：提醒用户领取奖励（每天上午10点）
export async function sendDailyRewardReminder() {
  try {
    // 获取所有绑定 Telegram 且持有 SM 代币的用户
    const { data: users } = await supabase
      .from('user_profiles')
      .select('telegram_username, wallet_address')
      .not('telegram_username', 'is', null);
    
    if (!users || users.length === 0) return;
    
    for (const user of users.slice(0, 50)) { // 限制数量
      try {
        // 检查用户是否可以领取奖励
        const { data: canClaim } = await supabase.rpc('can_claim_daily_reward', {
          p_user_wallet: user.wallet_address,
          p_claim_date: new Date().toISOString().split('T')[0]
        });
        
        if (!canClaim) continue; // 已领取，跳过
        
        // 获取用户奖励信息
        const rewardInfo = await smTokenExchange.getUserDailyRewardInfo(user.wallet_address);
        const dailyFlowers = Number(rewardInfo[1]);
        
        if (dailyFlowers === 0) continue; // 无奖励，跳过
        
        const reminderMessage = `
🌸 **每日奖励提醒**

您今日可领取 ${dailyFlowers} 朵小红花！

💡 记得每天领取，保持连续奖励记录哦～
`;

        await dailyRewardBot.telegram.sendMessage(user.telegram_username, reminderMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌸 立即领取', callback_data: 'claim_daily_reward' }]
            ]
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 200)); // 避免频率限制
        
      } catch (error) {
        console.error(`发送提醒给 ${user.telegram_username} 失败:`, error);
      }
    }
    
  } catch (error) {
    console.error('发送每日提醒失败:', error);
  }
}

// 错误处理
dailyRewardBot.catch((err, ctx) => {
  console.error('Daily reward bot error:', err);
  ctx.reply('❌ 发生错误，请稍后重试');
});

export default dailyRewardBot;
