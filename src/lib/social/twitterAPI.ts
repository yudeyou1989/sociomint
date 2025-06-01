/**
 * Twitter/X API 集成模块
 * 支持 OAuth 2.0 认证和用户行为追踪
 */

import { TwitterApi } from 'twitter-api-v2';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// 环境变量
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 初始化客户端
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Twitter API 客户端
const twitterClient = new TwitterApi(TWITTER_BEARER_TOKEN);

// OAuth 2.0 配置
const OAUTH_CONFIG = {
  clientId: TWITTER_CLIENT_ID,
  clientSecret: TWITTER_CLIENT_SECRET,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`,
  scopes: ['tweet.read', 'users.read', 'follows.read', 'like.read', 'offline.access']
};

// 用户行为类型
export enum TwitterActionType {
  FOLLOW = 'follow',
  LIKE = 'like',
  RETWEET = 'retweet',
  REPLY = 'reply',
  QUOTE = 'quote',
  MENTION = 'mention'
}

// 奖励配置
const REWARD_CONFIG = {
  [TwitterActionType.FOLLOW]: 50,    // 关注奖励 50 小红花
  [TwitterActionType.LIKE]: 10,     // 点赞奖励 10 小红花
  [TwitterActionType.RETWEET]: 25,  // 转发奖励 25 小红花
  [TwitterActionType.REPLY]: 30,    // 回复奖励 30 小红花
  [TwitterActionType.QUOTE]: 40,    // 引用奖励 40 小红花
  [TwitterActionType.MENTION]: 20   // 提及奖励 20 小红花
};

// 接口定义
interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  verified?: boolean;
  followers_count?: number;
  following_count?: number;
}

interface TwitterAction {
  userId: string;
  actionType: TwitterActionType;
  targetId: string;
  targetUrl?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface BindingResult {
  success: boolean;
  user?: TwitterUser;
  error?: string;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * 生成 OAuth 2.0 授权 URL
 */
export function generateAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    scope: OAUTH_CONFIG.scopes.join(' '),
    state: state,
    code_challenge_method: 'plain',
    code_challenge: 'challenge'
  });

  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

/**
 * 交换授权码获取访问令牌
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      code_verifier: 'challenge'
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
export async function getUserInfo(accessToken: string): Promise<TwitterUser> {
  const client = new TwitterApi(accessToken);
  
  const user = await client.v2.me({
    'user.fields': ['profile_image_url', 'verified', 'public_metrics']
  });

  return {
    id: user.data.id,
    username: user.data.username,
    name: user.data.name,
    profile_image_url: user.data.profile_image_url,
    verified: user.data.verified,
    followers_count: user.data.public_metrics?.followers_count,
    following_count: user.data.public_metrics?.following_count
  };
}

/**
 * 绑定 Twitter 账号
 */
export async function bindTwitterAccount(
  walletAddress: string,
  accessToken: string,
  refreshToken: string
): Promise<BindingResult> {
  try {
    // 获取用户信息
    const twitterUser = await getUserInfo(accessToken);
    
    // 检查是否已绑定
    const { data: existingBinding } = await supabase
      .from('user_profiles')
      .select('twitter_username')
      .eq('twitter_username', twitterUser.username)
      .single();

    if (existingBinding) {
      return {
        success: false,
        error: 'Twitter account already bound to another wallet'
      };
    }

    // 更新用户资料
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        twitter_username: twitterUser.username,
        twitter_verified: twitterUser.verified || false,
        twitter_followers_count: twitterUser.followers_count || 0,
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
        platform: 'twitter',
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7200 * 1000).toISOString(), // 2小时后过期
        updated_at: new Date().toISOString()
      });

    if (tokenError) {
      throw tokenError;
    }

    // 发放绑定奖励
    await rewardUser(walletAddress, TwitterActionType.FOLLOW, 'account_binding', {
      twitter_username: twitterUser.username,
      followers_count: twitterUser.followers_count
    });

    return {
      success: true,
      user: twitterUser,
      accessToken,
      refreshToken
    };

  } catch (error: any) {
    console.error('Twitter binding error:', error);
    return {
      success: false,
      error: error.message || 'Failed to bind Twitter account'
    };
  }
}

/**
 * 验证用户行为
 */
export async function verifyTwitterAction(
  walletAddress: string,
  actionType: TwitterActionType,
  targetId: string,
  targetUrl?: string
): Promise<{ success: boolean; reward?: number; error?: string }> {
  try {
    // 获取用户的访问令牌
    const { data: tokenData } = await supabase
      .from('social_tokens')
      .select('access_token, refresh_token')
      .eq('user_wallet', walletAddress)
      .eq('platform', 'twitter')
      .single();

    if (!tokenData) {
      return { success: false, error: 'Twitter account not bound' };
    }

    const client = new TwitterApi(tokenData.access_token);

    // 验证行为
    let verified = false;
    let metadata: Record<string, any> = {};

    switch (actionType) {
      case TwitterActionType.FOLLOW:
        verified = await verifyFollow(client, targetId);
        break;
      case TwitterActionType.LIKE:
        verified = await verifyLike(client, targetId);
        break;
      case TwitterActionType.RETWEET:
        verified = await verifyRetweet(client, targetId);
        break;
      case TwitterActionType.REPLY:
        verified = await verifyReply(client, targetId);
        break;
      default:
        return { success: false, error: 'Unsupported action type' };
    }

    if (!verified) {
      return { success: false, error: 'Action not verified' };
    }

    // 记录行为并发放奖励
    const reward = await rewardUser(walletAddress, actionType, targetId, {
      target_url: targetUrl,
      verified_at: new Date().toISOString(),
      ...metadata
    });

    return { success: true, reward };

  } catch (error: any) {
    console.error('Twitter action verification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 验证关注行为
 */
async function verifyFollow(client: TwitterApi, targetUserId: string): Promise<boolean> {
  try {
    const me = await client.v2.me();
    const following = await client.v2.following(me.data.id, {
      max_results: 1000
    });

    return following.data?.some(user => user.id === targetUserId) || false;
  } catch (error) {
    console.error('Verify follow error:', error);
    return false;
  }
}

/**
 * 验证点赞行为
 */
async function verifyLike(client: TwitterApi, tweetId: string): Promise<boolean> {
  try {
    const me = await client.v2.me();
    const likes = await client.v2.userLikedTweets(me.data.id, {
      max_results: 100
    });

    return likes.data?.some(tweet => tweet.id === tweetId) || false;
  } catch (error) {
    console.error('Verify like error:', error);
    return false;
  }
}

/**
 * 验证转发行为
 */
async function verifyRetweet(client: TwitterApi, tweetId: string): Promise<boolean> {
  try {
    const retweets = await client.v2.tweetRetweetedBy(tweetId);
    const me = await client.v2.me();

    return retweets.data?.some(user => user.id === me.data.id) || false;
  } catch (error) {
    console.error('Verify retweet error:', error);
    return false;
  }
}

/**
 * 验证回复行为
 */
async function verifyReply(client: TwitterApi, tweetId: string): Promise<boolean> {
  try {
    const me = await client.v2.me();
    const userTweets = await client.v2.userTimeline(me.data.id, {
      max_results: 100,
      'tweet.fields': ['in_reply_to_user_id', 'conversation_id']
    });

    return userTweets.data?.some(tweet => 
      tweet.conversation_id === tweetId || 
      tweet.in_reply_to_user_id === tweetId
    ) || false;
  } catch (error) {
    console.error('Verify reply error:', error);
    return false;
  }
}

/**
 * 发放用户奖励
 */
async function rewardUser(
  walletAddress: string,
  actionType: TwitterActionType,
  targetId: string,
  metadata: Record<string, any> = {}
): Promise<number> {
  const rewardAmount = REWARD_CONFIG[actionType];

  // 检查是否已经奖励过
  const { data: existingAction } = await supabase
    .from('user_actions')
    .select('id')
    .eq('user_wallet', walletAddress)
    .eq('platform', 'twitter')
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
      platform: 'twitter',
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
      source_id: `twitter_${actionType}_${targetId}`,
      platform: 'twitter',
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
}> {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
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
 * 获取用户的 Twitter 统计信息
 */
export async function getUserTwitterStats(walletAddress: string): Promise<{
  total_actions: number;
  total_rewards: number;
  actions_by_type: Record<string, number>;
  last_action_at?: string;
}> {
  const { data: actions } = await supabase
    .from('user_actions')
    .select('action_type, reward_amount, created_at')
    .eq('user_wallet', walletAddress)
    .eq('platform', 'twitter')
    .order('created_at', { ascending: false });

  if (!actions || actions.length === 0) {
    return {
      total_actions: 0,
      total_rewards: 0,
      actions_by_type: {}
    };
  }

  const actionsByType: Record<string, number> = {};
  let totalRewards = 0;

  actions.forEach(action => {
    actionsByType[action.action_type] = (actionsByType[action.action_type] || 0) + 1;
    totalRewards += action.reward_amount || 0;
  });

  return {
    total_actions: actions.length,
    total_rewards: totalRewards,
    actions_by_type: actionsByType,
    last_action_at: actions[0]?.created_at
  };
}
