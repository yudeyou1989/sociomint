/**
 * Discord API 集成模块
 * 支持 OAuth 2.0 认证和服务器活动追踪
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// 环境变量
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 初始化客户端
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Discord API 基础 URL
const DISCORD_API_BASE = 'https://discord.com/api/v10';

// OAuth 2.0 配置
const OAUTH_CONFIG = {
  clientId: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/discord/callback`,
  scopes: ['identify', 'guilds', 'guilds.members.read']
};

// 用户行为类型
export enum DiscordActionType {
  JOIN_GUILD = 'join_guild',
  MESSAGE = 'message',
  REACTION = 'reaction',
  VOICE_JOIN = 'voice_join',
  BOOST = 'boost',
  INVITE = 'invite'
}

// 奖励配置
const REWARD_CONFIG = {
  [DiscordActionType.JOIN_GUILD]: 100,   // 加入服务器奖励 100 小红花
  [DiscordActionType.MESSAGE]: 15,      // 发送消息奖励 15 小红花
  [DiscordActionType.REACTION]: 5,      // 添加反应奖励 5 小红花
  [DiscordActionType.VOICE_JOIN]: 20,   // 加入语音频道奖励 20 小红花
  [DiscordActionType.BOOST]: 500,      // 服务器加速奖励 500 小红花
  [DiscordActionType.INVITE]: 50       // 邀请用户奖励 50 小红花
};

// 接口定义
interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  verified?: boolean;
  email?: string;
  flags?: number;
  premium_type?: number;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  owner: boolean;
  permissions: string;
  features: string[];
}

interface BindingResult {
  success: boolean;
  user?: DiscordUser;
  guilds?: DiscordGuild[];
  error?: string;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * 生成 OAuth 2.0 授权 URL
 */
export function generateAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: OAUTH_CONFIG.scopes.join(' '),
    state: state
  });

  return `${DISCORD_API_BASE}/oauth2/authorize?${params.toString()}`;
}

/**
 * 交换授权码获取访问令牌
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}> {
  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: OAUTH_CONFIG.redirectUri
    })
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 获取用户信息
 */
export async function getUserInfo(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 获取用户的服务器列表
 */
export async function getUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get user guilds: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 绑定 Discord 账号
 */
export async function bindDiscordAccount(
  walletAddress: string,
  accessToken: string,
  refreshToken: string
): Promise<BindingResult> {
  try {
    // 获取用户信息
    const discordUser = await getUserInfo(accessToken);
    const userGuilds = await getUserGuilds(accessToken);
    
    // 检查是否已绑定
    const { data: existingBinding } = await supabase
      .from('user_profiles')
      .select('discord_username')
      .eq('discord_username', `${discordUser.username}#${discordUser.discriminator}`)
      .single();

    if (existingBinding) {
      return {
        success: false,
        error: 'Discord account already bound to another wallet'
      };
    }

    // 更新用户资料
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        discord_username: `${discordUser.username}#${discordUser.discriminator}`,
        discord_verified: discordUser.verified || false,
        discord_user_id: discordUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress);

    if (updateError) {
      throw updateError;
    }

    // 保存访问令牌
    const { error: tokenError } = await supabase
      .from('social_tokens')
      .upsert({
        user_wallet: walletAddress,
        platform: 'discord',
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 604800 * 1000).toISOString(), // 7天后过期
        updated_at: new Date().toISOString()
      });

    if (tokenError) {
      throw tokenError;
    }

    // 检查是否加入了 SocioMint 官方服务器
    const sociomintGuildId = process.env.DISCORD_GUILD_ID;
    const joinedSociomint = sociomintGuildId && userGuilds.some(guild => guild.id === sociomintGuildId);

    if (joinedSociomint) {
      // 发放加入服务器奖励
      await rewardUser(walletAddress, DiscordActionType.JOIN_GUILD, sociomintGuildId!, {
        discord_username: `${discordUser.username}#${discordUser.discriminator}`,
        guild_name: 'SocioMint Official'
      });
    }

    // 发放绑定奖励
    await rewardUser(walletAddress, DiscordActionType.JOIN_GUILD, 'account_binding', {
      discord_username: `${discordUser.username}#${discordUser.discriminator}`,
      guild_count: userGuilds.length
    });

    return {
      success: true,
      user: discordUser,
      guilds: userGuilds,
      accessToken,
      refreshToken
    };

  } catch (error: any) {
    console.error('Discord binding error:', error);
    return {
      success: false,
      error: error.message || 'Failed to bind Discord account'
    };
  }
}

/**
 * 验证用户在指定服务器的成员身份
 */
export async function verifyGuildMembership(
  walletAddress: string,
  guildId: string
): Promise<{ success: boolean; member?: any; error?: string }> {
  try {
    // 获取用户的 Discord ID
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('discord_user_id')
      .eq('wallet_address', walletAddress)
      .single();

    if (!userProfile?.discord_user_id) {
      return { success: false, error: 'Discord account not bound' };
    }

    // 使用 Bot Token 检查成员身份
    const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userProfile.discord_user_id}`, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'User not found in guild' };
      }
      throw new Error(`Failed to verify membership: ${response.statusText}`);
    }

    const member = await response.json();
    return { success: true, member };

  } catch (error: any) {
    console.error('Guild membership verification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 记录用户行为并发放奖励
 */
export async function recordDiscordAction(
  walletAddress: string,
  actionType: DiscordActionType,
  targetId: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; reward?: number; error?: string }> {
  try {
    const reward = await rewardUser(walletAddress, actionType, targetId, metadata);
    return { success: true, reward };
  } catch (error: any) {
    console.error('Discord action recording error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 发放用户奖励
 */
async function rewardUser(
  walletAddress: string,
  actionType: DiscordActionType,
  targetId: string,
  metadata: Record<string, any> = {}
): Promise<number> {
  const rewardAmount = REWARD_CONFIG[actionType];

  // 检查是否已经奖励过
  const { data: existingAction } = await supabase
    .from('user_actions')
    .select('id')
    .eq('user_wallet', walletAddress)
    .eq('platform', 'discord')
    .eq('action_type', actionType)
    .eq('target_id', targetId)
    .single();

  if (existingAction) {
    throw new Error('Action already rewarded');
  }

  // 记录用户行为
  const { error: actionError } = await supabase
    .from('user_actions')
    .insert({
      user_wallet: walletAddress,
      platform: 'discord',
      action_type: actionType,
      target_id: targetId,
      reward_amount: rewardAmount,
      metadata: metadata,
      created_at: new Date().toISOString()
    });

  if (actionError) {
    throw actionError;
  }

  // 记录小红花奖励
  const { error: rewardError } = await supabase
    .from('red_flower_rewards')
    .insert({
      user_wallet: walletAddress,
      amount: rewardAmount,
      source_type: 'social_action',
      source_id: `discord_${actionType}_${targetId}`,
      platform: 'discord',
      action_type: actionType,
      created_at: new Date().toISOString()
    });

  if (rewardError) {
    throw rewardError;
  }

  // 更新用户余额
  const { error: balanceError } = await supabase.rpc('update_user_balance', {
    p_wallet_address: walletAddress,
    p_red_flower_amount: rewardAmount
  });

  if (balanceError) {
    console.error('Balance update error:', balanceError);
  }

  return rewardAmount;
}

/**
 * 刷新访问令牌
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}> {
  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 获取用户的 Discord 统计信息
 */
export async function getUserDiscordStats(walletAddress: string): Promise<{
  total_actions: number;
  total_rewards: number;
  actions_by_type: Record<string, number>;
  last_action_at?: string;
  guilds_joined: number;
}> {
  const { data: actions } = await supabase
    .from('user_actions')
    .select('action_type, reward_amount, created_at')
    .eq('user_wallet', walletAddress)
    .eq('platform', 'discord')
    .order('created_at', { ascending: false });

  if (!actions || actions.length === 0) {
    return {
      total_actions: 0,
      total_rewards: 0,
      actions_by_type: {},
      guilds_joined: 0
    };
  }

  const actionsByType: Record<string, number> = {};
  let totalRewards = 0;

  actions.forEach(action => {
    actionsByType[action.action_type] = (actionsByType[action.action_type] || 0) + 1;
    totalRewards += action.reward_amount || 0;
  });

  const guildsJoined = actionsByType[DiscordActionType.JOIN_GUILD] || 0;

  return {
    total_actions: actions.length,
    total_rewards: totalRewards,
    actions_by_type: actionsByType,
    last_action_at: actions[0]?.created_at,
    guilds_joined: guildsJoined
  };
}

/**
 * Discord Webhook 发送消息
 */
export async function sendWebhookMessage(
  webhookUrl: string,
  content: string,
  embeds?: any[]
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content,
      embeds
    })
  });

  if (!response.ok) {
    throw new Error(`Webhook message failed: ${response.statusText}`);
  }
}
