import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

// 创建签名用的密钥
const secretKey = Deno.env.get('JWT_SECRET_KEY');
if (!secretKey) {
  throw new Error('JWT_SECRET_KEY 环境变量未设置');
}

// 获取智能合约地址
const presaleContractAddress = Deno.env.get('PRESALE_CONTRACT_ADDRESS');
if (!presaleContractAddress) {
  throw new Error('PRESALE_CONTRACT_ADDRESS 环境变量未设置');
}

// Twitter API Keys
const twitterApiKey = Deno.env.get('TWITTER_API_KEY');
const twitterApiSecret = Deno.env.get('TWITTER_API_SECRET');
const twitterBearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');

if (!twitterApiKey || !twitterApiSecret || !twitterBearerToken) {
  throw new Error('Twitter API 凭证未设置');
}

// 创建 Supabase 客户端
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 处理请求
serve(async (req) => {
  // CORS 预检请求处理
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // 仅接受 POST 请求
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: '只接受 POST 请求' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    // 解析请求体
    const body = await req.json();
    const { walletAddress, twitterUsername, twitterAuthToken } = body;

    // 验证必要参数
    if (!walletAddress || !twitterUsername || !twitterAuthToken) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数: walletAddress, twitterUsername 或 twitterAuthToken' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 验证钱包地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(JSON.stringify({ error: '无效的钱包地址格式' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 通过 Twitter API 验证用户
    const twitterVerified = await verifyTwitterUser(twitterUsername, twitterAuthToken);
    if (!twitterVerified.success) {
      return new Response(JSON.stringify({ error: twitterVerified.error }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 检查用户是否已经在数据库中验证过
    const { data: existingVerification, error: fetchError } = await supabase
      .from('platform_verifications')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('platform', 'twitter')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 是 "没有找到结果" 的错误代码
      return new Response(JSON.stringify({ error: '验证数据库查询失败', details: fetchError }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (existingVerification) {
      // 已经验证过，生成签名并返回
      const signature = await generateVerificationSignature(walletAddress);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: '用户已验证过',
          walletAddress,
          twitterUsername,
          twitterId: existingVerification.platform_user_id,
          verificationSignature: signature,
          alreadyVerified: true,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 将验证结果存入数据库
    const { data: insertData, error: insertError } = await supabase
      .from('platform_verifications')
      .insert([
        {
          wallet_address: walletAddress,
          platform: 'twitter',
          platform_username: twitterUsername,
          platform_user_id: twitterVerified.userId,
          verification_time: new Date().toISOString(),
          verification_data: {
            twitterProfileData: twitterVerified.profileData,
          },
        },
      ]);

    if (insertError) {
      return new Response(JSON.stringify({ error: '保存验证数据失败', details: insertError }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 为钱包地址生成验证签名
    const signature = await generateVerificationSignature(walletAddress);

    // 返回成功响应和签名
    return new Response(
      JSON.stringify({
        success: true,
        message: '用户验证成功',
        walletAddress,
        twitterUsername,
        twitterId: twitterVerified.userId,
        verificationSignature: signature,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('处理请求时出错:', error);
    return new Response(JSON.stringify({ error: '处理请求时出错', details: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

/**
 * 验证 Twitter 用户
 * @param username Twitter 用户名
 * @param authToken 用户授权令牌
 * @returns 验证结果
 */
async function verifyTwitterUser(username, authToken) {
  try {
    // 验证 authToken 是否有效 (实际实现会调用Twitter API)
    const response = await fetch(`https://api.twitter.com/2/users/by/username/${username}?user.fields=created_at,description,profile_image_url`, {
      headers: {
        'Authorization': `Bearer ${twitterBearerToken}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok || !data.data) {
      return {
        success: false,
        error: 'Twitter 用户验证失败',
        details: data,
      };
    }

    // 用自己的AuthToken验证是否能访问用户信息
    const authCheck = await fetch(`https://api.twitter.com/2/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const authData = await authCheck.json();
    
    if (!authCheck.ok || !authData.data || authData.data.username !== username) {
      return {
        success: false,
        error: '用户授权验证失败，无法确认身份',
        details: authData,
      };
    }

    return {
      success: true,
      userId: data.data.id,
      profileData: data.data,
    };
  } catch (error) {
    console.error('Twitter API调用失败:', error);
    return {
      success: false,
      error: 'Twitter API调用失败',
      details: error.message,
    };
  }
}

/**
 * 为钱包地址生成验证签名
 * @param walletAddress 钱包地址
 * @returns JWT签名
 */
async function generateVerificationSignature(walletAddress) {
  try {
    // 创建密钥对象
    const key = await jose.importJWK(
      { kty: 'oct', k: secretKey },
      'HS256'
    );

    // 生成JWT签名，包括合约地址和钱包地址
    const jwt = await new jose.SignJWT({
      walletAddress,
      contractAddress: presaleContractAddress,
      type: 'twitter-verification'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // 签名24小时有效
      .sign(key);

    return jwt;
  } catch (error) {
    console.error('生成签名失败:', error);
    throw new Error('生成验证签名失败: ' + error.message);
  }
} 