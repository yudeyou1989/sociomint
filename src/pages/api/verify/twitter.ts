/**
 * Twitter 身份验证 API 路由
 * 处理 OAuth 2.0 认证流程和行为验证
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  generateAuthUrl, 
  exchangeCodeForToken, 
  bindTwitterAccount,
  verifyTwitterAction,
  TwitterActionType
} from '@/lib/social/twitterAPI';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// API 响应类型
interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// 验证钱包签名
async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// 生成随机状态字符串
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;

    switch (action) {
      case 'auth':
        return handleAuth(req, res);
      case 'callback':
        return handleCallback(req, res);
      case 'verify':
        return handleVerify(req, res);
      case 'bind':
        return handleBind(req, res);
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }
  } catch (error: any) {
    console.error('Twitter API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

/**
 * 处理认证请求 - 生成 OAuth URL
 */
async function handleAuth(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { walletAddress, signature, message } = req.body;

  if (!walletAddress || !signature || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters'
    });
  }

  // 验证钱包签名
  const isValidSignature = await verifyWalletSignature(walletAddress, signature, message);
  if (!isValidSignature) {
    return res.status(401).json({
      success: false,
      error: 'Invalid wallet signature'
    });
  }

  // 生成状态字符串并保存
  const state = generateState();
  const authUrl = generateAuthUrl(state);

  // 保存状态到数据库（临时存储）
  await supabase
    .from('auth_states')
    .insert({
      state,
      wallet_address: walletAddress,
      platform: 'twitter',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10分钟过期
    });

  return res.status(200).json({
    success: true,
    data: {
      authUrl,
      state
    }
  });
}

/**
 * 处理 OAuth 回调
 */
async function handleCallback(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { code, state } = req.body;

  if (!code || !state) {
    return res.status(400).json({
      success: false,
      error: 'Missing authorization code or state'
    });
  }

  // 验证状态
  const { data: authState } = await supabase
    .from('auth_states')
    .select('wallet_address')
    .eq('state', state)
    .eq('platform', 'twitter')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!authState) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired state'
    });
  }

  try {
    // 交换授权码获取令牌
    const tokenData = await exchangeCodeForToken(code);
    
    // 绑定 Twitter 账号
    const bindingResult = await bindTwitterAccount(
      authState.wallet_address,
      tokenData.access_token,
      tokenData.refresh_token
    );

    // 清理状态记录
    await supabase
      .from('auth_states')
      .delete()
      .eq('state', state);

    if (bindingResult.success) {
      return res.status(200).json({
        success: true,
        data: {
          user: bindingResult.user,
          message: 'Twitter account bound successfully'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: bindingResult.error
      });
    }
  } catch (error: any) {
    console.error('Twitter callback error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * 处理行为验证
 */
async function handleVerify(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { 
    walletAddress, 
    signature, 
    message, 
    actionType, 
    targetId, 
    targetUrl 
  } = req.body;

  if (!walletAddress || !signature || !message || !actionType || !targetId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters'
    });
  }

  // 验证钱包签名
  const isValidSignature = await verifyWalletSignature(walletAddress, signature, message);
  if (!isValidSignature) {
    return res.status(401).json({
      success: false,
      error: 'Invalid wallet signature'
    });
  }

  // 验证行为类型
  if (!Object.values(TwitterActionType).includes(actionType)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid action type'
    });
  }

  try {
    const verificationResult = await verifyTwitterAction(
      walletAddress,
      actionType,
      targetId,
      targetUrl
    );

    if (verificationResult.success) {
      return res.status(200).json({
        success: true,
        data: {
          reward: verificationResult.reward,
          message: `Action verified! You earned ${verificationResult.reward} red flowers.`
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: verificationResult.error
      });
    }
  } catch (error: any) {
    console.error('Twitter verification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * 处理账号绑定状态查询
 */
async function handleBind(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { walletAddress } = req.query;

  if (!walletAddress || typeof walletAddress !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing wallet address'
    });
  }

  try {
    // 查询用户的 Twitter 绑定状态
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('twitter_username, twitter_verified')
      .eq('wallet_address', walletAddress)
      .single();

    const isBound = userProfile?.twitter_username ? true : false;

    return res.status(200).json({
      success: true,
      data: {
        isBound,
        twitterUsername: userProfile?.twitter_username,
        twitterVerified: userProfile?.twitter_verified || false
      }
    });
  } catch (error: any) {
    console.error('Twitter bind status error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
