import { Telegraf, Context, Markup } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import type { Database } from '@/types/supabase';

// 环境变量
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AIRDROP_POOL_ADDRESS = process.env.NEXT_PUBLIC_AIRDROP_POOL_ADDRESS!;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

// 初始化客户端
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const provider = new ethers.JsonRpcProvider(RPC_URL);

// 空投池合约 ABI（简化版）
const AIRDROP_POOL_ABI = [
  'function getCurrentRound() view returns (tuple(uint256 id, uint256 startTime, uint256 endTime, uint256 totalDeposits, uint256 totalRewards, uint256 participantCount, bool distributed))',
  'function getUserCurrentDeposit(address user) view returns (tuple(uint256 amount, uint256 roundId, uint256 timestamp, bool claimed))',
  'function calculateUserReward(address user, uint256 roundId) view returns (uint256)',
  'function poolConfig() view returns (tuple(uint256 weeklySmAmount, uint256 roundDuration, uint256 minDeposit, uint256 maxDeposit, bool isActive))'
];

// 创建合约实例
const airdropContract = new ethers.Contract(AIRDROP_POOL_ADDRESS, AIRDROP_POOL_ABI, provider);

// 扩展 Context 类型
interface BotContext extends Context {
  session?: {
    walletAddress?: string;
    userId?: string;
  };
}

// 创建 Bot 实例
export const airdropBot = new Telegraf<BotContext>(TELEGRAM_BOT_TOKEN);

// 中间件：会话管理
airdropBot.use(async (ctx, next) => {
  ctx.session = ctx.session || {};
  
  // 尝试从数据库获取用户信息
  if (ctx.from?.id) {
    const { data: user } = await supabase
      .from('user_profiles')
      .select('id, wallet_address, telegram_username')
      .eq('telegram_username', ctx.from.username || ctx.from.id.toString())
      .single();
    
    if (user) {
      ctx.session.walletAddress = user.wallet_address;
      ctx.session.userId = user.id;
    }
  }
  
  return next();
});

// 辅助函数：格式化数字
function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

// 辅助函数：格式化时间
function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '已结束';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}天 ${hours}小时 ${minutes}分钟`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  return `${minutes}分钟`;
}

// 命令：/start
airdropBot.command('start', async (ctx) => {
  const welcomeMessage = `
🌸 欢迎来到 SocioMint 小红花空投池！

🎯 **功能介绍**
• 使用小红花参与每周 SM 代币空投
• 根据投入比例分配奖励
• 支持多平台绑定验证

📋 **可用命令**
/airdrop_status - 查看空投进度
/deposit_flowers [数量] - 投入小红花
/claim_reward - 领取奖励
/my_stats - 查看我的统计
/leaderboard - 查看排行榜
/help - 帮助信息

🔗 **绑定钱包**
请先在 SocioMint 网站绑定您的 Telegram 账号和钱包地址。
`;

  await ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🌐 访问 SocioMint', url: 'https://sociomint.com' }],
        [{ text: '📊 查看空投状态', callback_data: 'airdrop_status' }]
      ]
    }
  });
});

// 命令：/airdrop_status
airdropBot.command('airdrop_status', async (ctx) => {
  try {
    // 获取当前轮次信息
    const currentRound = await airdropContract.getCurrentRound();
    const poolConfig = await airdropContract.poolConfig();
    
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(currentRound.endTime);
    const remaining = endTime - now;
    
    const totalDeposits = parseFloat(ethers.formatEther(currentRound.totalDeposits));
    const weeklyReward = parseFloat(ethers.formatEther(poolConfig.weeklySmAmount));
    
    const statusMessage = `
🎯 **第 ${currentRound.id} 轮空投状态**

⏰ **剩余时间**: ${formatTimeRemaining(remaining)}
💰 **总投入**: ${formatNumber(totalDeposits)} 小红花
👥 **参与人数**: ${currentRound.participantCount} 人
🏆 **奖励池**: ${formatNumber(weeklyReward)} SM

📊 **进度**: ${((totalDeposits / (weeklyReward * 100)) * 100).toFixed(1)}%

${remaining > 0 ? '🟢 投入进行中' : '🔴 本轮已结束'}
`;

    await ctx.reply(statusMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💸 投入小红花', callback_data: 'deposit_flowers' }],
          [{ text: '🏆 查看排行榜', callback_data: 'leaderboard' }],
          [{ text: '🔄 刷新状态', callback_data: 'airdrop_status' }]
        ]
      }
    });
    
  } catch (error) {
    console.error('获取空投状态失败:', error);
    await ctx.reply('❌ 获取空投状态失败，请稍后重试。');
  }
});

// 命令：/deposit_flowers
airdropBot.command('deposit_flowers', async (ctx) => {
  if (!ctx.session?.walletAddress) {
    await ctx.reply('❌ 请先在 SocioMint 网站绑定您的钱包地址。', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔗 绑定钱包', url: 'https://sociomint.com/profile' }]
        ]
      }
    });
    return;
  }
  
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    await ctx.reply(`
💸 **投入小红花**

使用方法: \`/deposit_flowers [数量]\`
例如: \`/deposit_flowers 100\`

⚠️ **注意事项**
• 每轮只能投入一次
• 最小投入: 10 小红花
• 最大投入: 10,000 小红花
• 需要足够的小红花余额
`, { parse_mode: 'Markdown' });
    return;
  }
  
  const amount = parseFloat(args[1]);
  if (isNaN(amount) || amount <= 0) {
    await ctx.reply('❌ 请输入有效的投入数量。');
    return;
  }
  
  try {
    // 检查用户是否已投入
    const userDeposit = await airdropContract.getUserCurrentDeposit(ctx.session.walletAddress);
    if (userDeposit.amount > 0) {
      await ctx.reply('❌ 您已在本轮投入过小红花，每轮只能投入一次。');
      return;
    }
    
    // 生成投入链接
    const depositUrl = `https://sociomint.com/airdrop?amount=${amount}&from=telegram`;
    
    await ctx.reply(`
💸 **确认投入 ${formatNumber(amount)} 小红花**

请点击下方按钮前往网站完成投入：
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💸 前往投入', url: depositUrl }],
          [{ text: '📊 查看状态', callback_data: 'airdrop_status' }]
        ]
      }
    });
    
  } catch (error) {
    console.error('处理投入命令失败:', error);
    await ctx.reply('❌ 处理投入命令失败，请稍后重试。');
  }
});

// 命令：/claim_reward
airdropBot.command('claim_reward', async (ctx) => {
  if (!ctx.session?.walletAddress) {
    await ctx.reply('❌ 请先在 SocioMint 网站绑定您的钱包地址。');
    return;
  }
  
  try {
    // 查询用户可领取的奖励
    const { data: deposits } = await supabase
      .from('airdrop_deposits')
      .select(`
        *,
        airdrop_rounds!inner(*)
      `)
      .eq('wallet_address', ctx.session.walletAddress)
      .eq('is_claimed', false)
      .eq('airdrop_rounds.is_distributed', true);
    
    if (!deposits || deposits.length === 0) {
      await ctx.reply('🤷‍♂️ 暂无可领取的奖励。');
      return;
    }
    
    let totalReward = 0;
    const rewardList = deposits.map(deposit => {
      const reward = parseFloat(deposit.actual_reward || '0');
      totalReward += reward;
      return `• 第 ${deposit.round_id} 轮: ${formatNumber(reward)} SM`;
    }).join('\n');
    
    const claimUrl = 'https://sociomint.com/airdrop/claim?from=telegram';
    
    await ctx.reply(`
🏆 **可领取奖励**

${rewardList}

💰 **总计**: ${formatNumber(totalReward)} SM

请点击下方按钮前往网站领取：
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏆 前往领取', url: claimUrl }],
          [{ text: '📊 查看统计', callback_data: 'my_stats' }]
        ]
      }
    });
    
  } catch (error) {
    console.error('查询奖励失败:', error);
    await ctx.reply('❌ 查询奖励失败，请稍后重试。');
  }
});

// 命令：/my_stats
airdropBot.command('my_stats', async (ctx) => {
  if (!ctx.session?.walletAddress) {
    await ctx.reply('❌ 请先在 SocioMint 网站绑定您的钱包地址。');
    return;
  }
  
  try {
    const { data: stats } = await supabase
      .from('user_airdrop_stats')
      .select('*')
      .eq('user_id', ctx.session.userId)
      .single();
    
    if (!stats) {
      await ctx.reply('📊 您还没有参与过空投，快来投入小红花吧！');
      return;
    }
    
    const statsMessage = `
📊 **我的空投统计**

💸 **总投入**: ${formatNumber(parseFloat(stats.total_deposits || '0'))} 小红花
🏆 **总奖励**: ${formatNumber(parseFloat(stats.total_rewards || '0'))} SM
🎯 **参与轮次**: ${stats.total_rounds_participated} 轮
✅ **已领取**: ${stats.total_rounds_claimed} 轮

📅 **首次参与**: ${stats.first_participation_at ? new Date(stats.first_participation_at).toLocaleDateString() : '未知'}
📅 **最近参与**: ${stats.last_participation_at ? new Date(stats.last_participation_at).toLocaleDateString() : '未知'}
`;

    await ctx.reply(statsMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💸 投入小红花', callback_data: 'deposit_flowers' }],
          [{ text: '🏆 领取奖励', callback_data: 'claim_reward' }]
        ]
      }
    });
    
  } catch (error) {
    console.error('查询统计失败:', error);
    await ctx.reply('❌ 查询统计失败，请稍后重试。');
  }
});

// 命令：/leaderboard
airdropBot.command('leaderboard', async (ctx) => {
  try {
    // 获取当前轮次排行榜
    const { data: leaderboard } = await supabase
      .from('round_leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .limit(10);
    
    if (!leaderboard || leaderboard.length === 0) {
      await ctx.reply('📊 暂无排行榜数据。');
      return;
    }
    
    const leaderboardText = leaderboard.map((entry, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      const username = entry.username || `${entry.wallet_address.slice(0, 6)}...${entry.wallet_address.slice(-4)}`;
      const amount = formatNumber(parseFloat(entry.deposited_flowers || '0'));
      const percentage = parseFloat(entry.deposit_percentage || '0').toFixed(1);
      
      return `${medal} ${username}: ${amount} (${percentage}%)`;
    }).join('\n');
    
    await ctx.reply(`
🏆 **本轮排行榜 Top 10**

${leaderboardText}

💡 投入更多小红花获得更高排名！
`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💸 投入小红花', callback_data: 'deposit_flowers' }],
          [{ text: '📊 查看状态', callback_data: 'airdrop_status' }]
        ]
      }
    });
    
  } catch (error) {
    console.error('查询排行榜失败:', error);
    await ctx.reply('❌ 查询排行榜失败，请稍后重试。');
  }
});

// 回调查询处理
airdropBot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  
  switch (data) {
    case 'airdrop_status':
      await ctx.answerCbQuery();
      return ctx.scene.enter('airdrop_status');
    case 'deposit_flowers':
      await ctx.answerCbQuery();
      return ctx.reply('请使用命令: /deposit_flowers [数量]');
    case 'leaderboard':
      await ctx.answerCbQuery();
      return ctx.scene.enter('leaderboard');
    case 'my_stats':
      await ctx.answerCbQuery();
      return ctx.scene.enter('my_stats');
    case 'claim_reward':
      await ctx.answerCbQuery();
      return ctx.scene.enter('claim_reward');
    default:
      await ctx.answerCbQuery('未知操作');
  }
});

// 定时推送：每周排行榜
export async function sendWeeklyLeaderboard() {
  try {
    // 获取所有绑定 Telegram 的用户
    const { data: users } = await supabase
      .from('user_profiles')
      .select('telegram_username')
      .not('telegram_username', 'is', null);
    
    if (!users) return;
    
    // 获取上周排行榜
    const { data: leaderboard } = await supabase
      .from('round_leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .limit(5);
    
    if (!leaderboard || leaderboard.length === 0) return;
    
    const message = `
🏆 **上周空投排行榜**

${leaderboard.map((entry, index) => {
  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
  const username = entry.username || 'Anonymous';
  const amount = formatNumber(parseFloat(entry.deposited_flowers || '0'));
  return `${medal} ${username}: ${amount} 小红花`;
}).join('\n')}

🎯 新一轮空投已开始，快来参与吧！
`;

    // 发送给所有用户（实际应用中可能需要分批发送）
    for (const user of users.slice(0, 10)) { // 限制发送数量
      try {
        await airdropBot.telegram.sendMessage(user.telegram_username, message);
        await new Promise(resolve => setTimeout(resolve, 100)); // 避免频率限制
      } catch (error) {
        console.error(`发送消息给 ${user.telegram_username} 失败:`, error);
      }
    }
    
  } catch (error) {
    console.error('发送周排行榜失败:', error);
  }
}

// 错误处理
airdropBot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ 发生错误，请稍后重试。');
});

export default airdropBot;
