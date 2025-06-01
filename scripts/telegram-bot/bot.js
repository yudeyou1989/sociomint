/**
 * SocioMint Telegram Bot
 * 
 * 该脚本实现Telegram Bot，支持查看任务、领取奖励和推送通知
 */

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const axios = require('axios');
const cron = require('node-cron');

// 创建Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少Supabase配置。请确保设置了NEXT_PUBLIC_SUPABASE_URL和SUPABASE_SERVICE_KEY环境变量。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 创建以太坊提供者
const rpcUrl = process.env.RPC_URL;
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

// 加载合约ABI和地址
const SMRewardDistributorABI = require('../../artifacts/contracts/SMRewardDistributor.sol/SMRewardDistributor.json').abi;
const rewardDistributorAddress = process.env.REWARD_DISTRIBUTOR_ADDRESS;

// 创建合约实例
const rewardDistributor = new ethers.Contract(rewardDistributorAddress, SMRewardDistributorABI, provider);

// 用户会话存储
const userSessions = {};

// 启动消息
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username;
  
  try {
    // 检查用户是否已绑定
    const { data: existingUser, error: userError } = await supabase
      .from('social_connections')
      .select('user_id')
      .eq('platform', 'telegram')
      .eq('platform_id', userId.toString())
      .maybeSingle();
    
    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }
    
    if (existingUser) {
      // 用户已绑定
      userSessions[userId] = { userId: existingUser.user_id };
      
      await ctx.reply(
        `欢迎回来，${ctx.from.first_name}！\n\n您已成功绑定SocioMint账号。使用下方按钮查看可用功能。`,
        Markup.keyboard([
          ['📋 查看任务', '🎁 领取奖励'],
          ['📊 我的统计', '👥 推荐系统']
        ]).resize()
      );
    } else {
      // 用户未绑定
      await ctx.reply(
        `欢迎使用SocioMint机器人，${ctx.from.first_name}！\n\n您需要先绑定您的SocioMint账号才能使用完整功能。请访问SocioMint网站，在"账号设置"中绑定Telegram账号。`,
        Markup.inlineKeyboard([
          Markup.button.url('访问SocioMint', 'https://sociomint.com/settings/social')
        ])
      );
    }
  } catch (error) {
    console.error('处理start命令错误:', error);
    await ctx.reply('抱歉，发生了错误。请稍后再试。');
  }
});

// 帮助命令
bot.help((ctx) => {
  ctx.reply(
    '🤖 SocioMint机器人帮助\n\n' +
    '可用命令:\n' +
    '/start - 启动机器人\n' +
    '/tasks - 查看可用任务\n' +
    '/claim - 领取SM奖励\n' +
    '/stats - 查看我的统计\n' +
    '/referral - 推荐系统\n' +
    '/help - 显示帮助信息'
  );
});

// 查看任务
bot.command('tasks', async (ctx) => {
  await handleTasksCommand(ctx);
});

bot.hears('📋 查看任务', async (ctx) => {
  await handleTasksCommand(ctx);
});

async function handleTasksCommand(ctx) {
  const userId = ctx.from.id;
  
  try {
    // 检查用户是否已绑定
    const { data: connection, error: connectionError } = await supabase
      .from('social_connections')
      .select('user_id')
      .eq('platform', 'telegram')
      .eq('platform_id', userId.toString())
      .maybeSingle();
    
    if (connectionError && connectionError.code !== 'PGRST116') {
      throw connectionError;
    }
    
    if (!connection) {
      return ctx.reply(
        '您需要先绑定SocioMint账号才能查看任务。请访问SocioMint网站，在"账号设置"中绑定Telegram账号。',
        Markup.inlineKeyboard([
          Markup.button.url('访问SocioMint', 'https://sociomint.com/settings/social')
        ])
      );
    }
    
    // 获取可用任务
    const { data: tasks, error: tasksError } = await supabase
      .from('social_tasks')
      .select('*')
      .eq('platform', 'telegram')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (tasksError) {
      throw tasksError;
    }
    
    if (!tasks || tasks.length === 0) {
      return ctx.reply('当前没有可用的Telegram任务。请稍后再查看或访问网站查看其他平台的任务。');
    }
    
    // 发送任务列表
    let message = '📋 可用的Telegram任务:\n\n';
    
    for (const task of tasks) {
      message += `🔹 ${task.title}\n`;
      message += `描述: ${task.description}\n`;
      message += `奖励: ${task.flower_reward} 小红花\n`;
      message += `消耗: ${task.flower_cost} 小红花\n\n`;
    }
    
    message += '要完成任务，请访问SocioMint网站的任务中心。';
    
    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        Markup.button.url('访问任务中心', 'https://sociomint.com/tasks')
      ])
    );
  } catch (error) {
    console.error('处理tasks命令错误:', error);
    await ctx.reply('抱歉，获取任务时发生错误。请稍后再试。');
  }
}

// 领取奖励
bot.command('claim', async (ctx) => {
  await handleClaimCommand(ctx);
});

bot.hears('🎁 领取奖励', async (ctx) => {
  await handleClaimCommand(ctx);
});

async function handleClaimCommand(ctx) {
  const userId = ctx.from.id;
  
  try {
    // 检查用户是否已绑定
    const { data: connection, error: connectionError } = await supabase
      .from('social_connections')
      .select('user_id')
      .eq('platform', 'telegram')
      .eq('platform_id', userId.toString())
      .maybeSingle();
    
    if (connectionError && connectionError.code !== 'PGRST116') {
      throw connectionError;
    }
    
    if (!connection) {
      return ctx.reply(
        '您需要先绑定SocioMint账号才能领取奖励。请访问SocioMint网站，在"账号设置"中绑定Telegram账号。',
        Markup.inlineKeyboard([
          Markup.button.url('访问SocioMint', 'https://sociomint.com/settings/social')
        ])
      );
    }
    
    // 获取用户钱包地址
    const { data: wallet, error: walletError } = await supabase
      .from('wallet_connections')
      .select('wallet_address')
      .eq('user_id', connection.user_id)
      .eq('is_primary', true)
      .maybeSingle();
    
    if (walletError) {
      throw walletError;
    }
    
    if (!wallet) {
      return ctx.reply(
        '您需要先在SocioMint网站上连接钱包才能领取奖励。',
        Markup.inlineKeyboard([
          Markup.button.url('连接钱包', 'https://sociomint.com/settings/wallet')
        ])
      );
    }
    
    // 获取当前周数和年份
    const { data: currentWeek, error: weekError } = await supabase.rpc('get_current_week');
    
    if (weekError) {
      throw weekError;
    }
    
    const weekNumber = currentWeek[0].week_number;
    const year = currentWeek[0].year;
    
    // 获取用户奖励
    const { data: reward, error: rewardError } = await supabase
      .from('weekly_reward_distributions')
      .select('*')
      .eq('user_id', connection.user_id)
      .eq('claimed', false)
      .order('created_at', { ascending: false })
      .maybeSingle();
    
    if (rewardError) {
      throw rewardError;
    }
    
    if (!reward) {
      return ctx.reply('您当前没有可领取的奖励。请完成更多社交任务，消耗小红花来获得SM代币奖励。');
    }
    
    // 获取奖励池信息
    const { data: pool, error: poolError } = await supabase
      .from('weekly_reward_pools')
      .select('*')
      .eq('id', reward.pool_id)
      .single();
    
    if (poolError) {
      throw poolError;
    }
    
    if (!pool.distributed) {
      return ctx.reply(`本周(第${weekNumber}周)的奖励池尚未分配。请等待系统分配奖励后再来领取。`);
    }
    
    await ctx.reply(
      `您有 ${reward.sm_amount} SM 代币奖励可领取！\n\n` +
      `请访问SocioMint网站领取您的奖励。`,
      Markup.inlineKeyboard([
        Markup.button.url('领取奖励', 'https://sociomint.com/rewards')
      ])
    );
  } catch (error) {
    console.error('处理claim命令错误:', error);
    await ctx.reply('抱歉，获取奖励信息时发生错误。请稍后再试。');
  }
}

// 我的统计
bot.command('stats', async (ctx) => {
  await handleStatsCommand(ctx);
});

bot.hears('📊 我的统计', async (ctx) => {
  await handleStatsCommand(ctx);
});

async function handleStatsCommand(ctx) {
  const userId = ctx.from.id;
  
  try {
    // 检查用户是否已绑定
    const { data: connection, error: connectionError } = await supabase
      .from('social_connections')
      .select('user_id')
      .eq('platform', 'telegram')
      .eq('platform_id', userId.toString())
      .maybeSingle();
    
    if (connectionError && connectionError.code !== 'PGRST116') {
      throw connectionError;
    }
    
    if (!connection) {
      return ctx.reply(
        '您需要先绑定SocioMint账号才能查看统计信息。请访问SocioMint网站，在"账号设置"中绑定Telegram账号。',
        Markup.inlineKeyboard([
          Markup.button.url('访问SocioMint', 'https://sociomint.com/settings/social')
        ])
      );
    }
    
    // 获取用户小红花余额
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('xiaohonghua_balance')
      .eq('id', connection.user_id)
      .single();
    
    if (userError) {
      throw userError;
    }
    
    // 获取用户完成的任务数量
    const { data: completions, error: completionsError } = await supabase
      .from('social_task_completions')
      .select('id', { count: 'exact' })
      .eq('user_id', connection.user_id);
    
    if (completionsError) {
      throw completionsError;
    }
    
    // 获取用户本周消耗的小红花
    const { data: currentWeek, error: weekError } = await supabase.rpc('get_current_week');
    
    if (weekError) {
      throw weekError;
    }
    
    const weekNumber = currentWeek[0].week_number;
    const year = currentWeek[0].year;
    
    const { data: spending, error: spendingError } = await supabase
      .from('flower_spending')
      .select('sum')
      .eq('user_id', connection.user_id)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .single();
    
    if (spendingError && spendingError.code !== 'PGRST116') {
      throw spendingError;
    }
    
    const weeklySpending = spending?.sum || 0;
    
    // 获取用户社交影响力
    const { data: influence, error: influenceError } = await supabase
      .from('social_influence')
      .select('influence_score')
      .eq('user_id', connection.user_id)
      .eq('platform', 'telegram')
      .maybeSingle();
    
    if (influenceError && influenceError.code !== 'PGRST116') {
      throw influenceError;
    }
    
    const influenceScore = influence?.influence_score || 1.0;
    
    await ctx.reply(
      `📊 您的SocioMint统计\n\n` +
      `🌸 小红花余额: ${user.xiaohonghua_balance}\n` +
      `🔢 完成任务数: ${completions.length}\n` +
      `📉 本周消耗: ${weeklySpending} 小红花\n` +
      `⭐ 影响力得分: ${influenceScore.toFixed(2)}\n\n` +
      `访问SocioMint网站查看更多详细统计信息。`,
      Markup.inlineKeyboard([
        Markup.button.url('查看详情', 'https://sociomint.com/dashboard')
      ])
    );
  } catch (error) {
    console.error('处理stats命令错误:', error);
    await ctx.reply('抱歉，获取统计信息时发生错误。请稍后再试。');
  }
}

// 推荐系统
bot.command('referral', async (ctx) => {
  await handleReferralCommand(ctx);
});

bot.hears('👥 推荐系统', async (ctx) => {
  await handleReferralCommand(ctx);
});

async function handleReferralCommand(ctx) {
  const userId = ctx.from.id;
  
  try {
    // 检查用户是否已绑定
    const { data: connection, error: connectionError } = await supabase
      .from('social_connections')
      .select('user_id')
      .eq('platform', 'telegram')
      .eq('platform_id', userId.toString())
      .maybeSingle();
    
    if (connectionError && connectionError.code !== 'PGRST116') {
      throw connectionError;
    }
    
    if (!connection) {
      return ctx.reply(
        '您需要先绑定SocioMint账号才能使用推荐系统。请访问SocioMint网站，在"账号设置"中绑定Telegram账号。',
        Markup.inlineKeyboard([
          Markup.button.url('访问SocioMint', 'https://sociomint.com/settings/social')
        ])
      );
    }
    
    // 获取用户推荐码
    const { data: referralCode, error: codeError } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', connection.user_id)
      .maybeSingle();
    
    if (codeError && codeError.code !== 'PGRST116') {
      throw codeError;
    }
    
    if (!referralCode) {
      return ctx.reply(
        '您还没有推荐码。请访问SocioMint网站获取您的推荐码。',
        Markup.inlineKeyboard([
          Markup.button.url('获取推荐码', 'https://sociomint.com/referral')
        ])
      );
    }
    
    // 获取推荐统计
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id', { count: 'exact' })
      .eq('referrer_id', connection.user_id);
    
    if (referralsError) {
      throw referralsError;
    }
    
    const referralCount = referrals.length;
    
    // 获取活跃推荐数
    const { data: activeReferrals, error: activeError } = await supabase
      .from('referrals')
      .select('id', { count: 'exact' })
      .eq('referrer_id', connection.user_id)
      .eq('status', 'active');
    
    if (activeError) {
      throw activeError;
    }
    
    const activeCount = activeReferrals.length;
    
    // 生成推荐链接
    const referralLink = `https://sociomint.com/register?ref=${referralCode.code}`;
    
    await ctx.reply(
      `👥 SocioMint推荐系统\n\n` +
      `🔑 您的推荐码: ${referralCode.code}\n` +
      `👤 直接推荐: ${referralCount} 人\n` +
      `✅ 活跃推荐: ${activeCount} 人\n\n` +
      `分享您的推荐链接，当新用户使用它注册时，您和被推荐人都将获得奖励！\n\n` +
      `🔗 推荐链接:\n${referralLink}`,
      Markup.inlineKeyboard([
        Markup.button.url('查看详情', 'https://sociomint.com/referral')
      ])
    );
  } catch (error) {
    console.error('处理referral命令错误:', error);
    await ctx.reply('抱歉，获取推荐信息时发生错误。请稍后再试。');
  }
}

// 每周发送Top 20用户排行榜
cron.schedule('0 12 * * 1', async () => {
  try {
    console.log('发送周排行榜...');
    
    // 获取当前周数和年份
    const { data: currentWeek, error: weekError } = await supabase.rpc('get_current_week');
    
    if (weekError) {
      throw weekError;
    }
    
    // 获取上一周的周数和年份
    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeekNumber = getWeekNumber(lastWeekDate);
    const lastWeekYear = lastWeekDate.getFullYear();
    
    // 获取上周的Top 20用户
    const { data: topUsers, error: topUsersError } = await supabase
      .from('weekly_reward_distributions')
      .select(`
        user_id,
        wallet_address,
        flower_spent,
        influence_score,
        sm_amount,
        social_connections(platform_username)
      `)
      .eq('week_number', lastWeekNumber)
      .eq('year', lastWeekYear)
      .order('sm_amount', { ascending: false })
      .limit(20);
    
    if (topUsersError) {
      throw topUsersError;
    }
    
    if (!topUsers || topUsers.length === 0) {
      console.log('没有找到上周的Top用户');
      return;
    }
    
    // 构建消息
    let message = `🏆 SocioMint上周(第${lastWeekNumber}周)Top 20用户排行榜\n\n`;
    
    topUsers.forEach((user, index) => {
      const username = user.social_connections?.find(c => c.platform === 'telegram')?.platform_username || '未知用户';
      message += `${index + 1}. ${username}\n`;
      message += `   💰 奖励: ${user.sm_amount} SM\n`;
      message += `   🌸 消耗: ${user.flower_spent} 小红花\n`;
      message += `   ⭐ 影响力: ${user.influence_score.toFixed(2)}\n\n`;
    });
    
    message += `🎯 本周(第${currentWeek[0].week_number}周)排行榜正在进行中！完成更多社交任务，消耗小红花来提高您的排名！`;
    
    // 获取所有绑定了Telegram的用户
    const { data: telegramUsers, error: telegramError } = await supabase
      .from('social_connections')
      .select('platform_id')
      .eq('platform', 'telegram');
    
    if (telegramError) {
      throw telegramError;
    }
    
    // 发送消息给所有用户
    for (const user of telegramUsers) {
      try {
        await bot.telegram.sendMessage(
          user.platform_id,
          message,
          Markup.inlineKeyboard([
            Markup.button.url('查看详情', 'https://sociomint.com/rewards')
          ])
        );
        
        // 添加延迟避免触发Telegram API限制
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`向用户 ${user.platform_id} 发送消息失败:`, error);
      }
    }
    
    console.log(`已向 ${telegramUsers.length} 个用户发送周排行榜`);
  } catch (error) {
    console.error('发送周排行榜失败:', error);
  }
});

// 获取周数
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// 启动机器人
bot.launch().then(() => {
  console.log('SocioMint Telegram Bot已启动');
}).catch(err => {
  console.error('启动Telegram Bot失败:', err);
});

// 优雅关闭
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
