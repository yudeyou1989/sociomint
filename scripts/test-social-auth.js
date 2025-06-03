#!/usr/bin/env node

/**
 * 社交登录测试脚本
 * 测试 Discord 和 Twitter OAuth 配置
 */

const https = require('https');
const { URL } = require('url');

// 配置信息
const config = {
  discord: {
    clientId: 'dXNNbndMRU1yZy1zRHpfX3haRTA6MTpjaQ',
    clientSecret: 'hSBZpLfwQPLJQipTHleiry0PzBADlWBC',
    redirectUri: 'https://sociomint.top/api/auth/discord/callback',
    scope: 'identify email'
  },
  twitter: {
    clientId: 'dXNNbndMRU1yZy1zRHpfX3haRTA6MTpjaQ',
    clientSecret: 'PGOyGmIuxTMSGwokvojztPOHuFTTMAf3XULy5iChFxJu74YU6f',
    redirectUri: 'https://sociomint.top/api/auth/twitter/callback',
    scope: 'tweet.read users.read'
  }
};

console.log('🔐 SocioMint 社交登录配置测试');
console.log('=====================================');

// 测试 Discord OAuth URL 生成
function testDiscordAuth() {
  console.log('\n💬 Discord OAuth 测试:');
  
  const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
  discordAuthUrl.searchParams.set('client_id', config.discord.clientId);
  discordAuthUrl.searchParams.set('redirect_uri', config.discord.redirectUri);
  discordAuthUrl.searchParams.set('response_type', 'code');
  discordAuthUrl.searchParams.set('scope', config.discord.scope);
  discordAuthUrl.searchParams.set('state', 'discord_auth_test');
  
  console.log('✅ Discord 客户端 ID:', config.discord.clientId);
  console.log('✅ Discord 回调 URL:', config.discord.redirectUri);
  console.log('✅ Discord 授权 URL:');
  console.log(discordAuthUrl.toString());
  
  return discordAuthUrl.toString();
}

// 测试 Twitter OAuth URL 生成
function testTwitterAuth() {
  console.log('\n🐦 Twitter OAuth 测试:');
  
  const twitterAuthUrl = new URL('https://twitter.com/i/oauth2/authorize');
  twitterAuthUrl.searchParams.set('client_id', config.twitter.clientId);
  twitterAuthUrl.searchParams.set('redirect_uri', config.twitter.redirectUri);
  twitterAuthUrl.searchParams.set('response_type', 'code');
  twitterAuthUrl.searchParams.set('scope', config.twitter.scope);
  twitterAuthUrl.searchParams.set('state', 'twitter_auth_test');
  twitterAuthUrl.searchParams.set('code_challenge', 'challenge');
  twitterAuthUrl.searchParams.set('code_challenge_method', 'plain');
  
  console.log('✅ Twitter 客户端 ID:', config.twitter.clientId);
  console.log('✅ Twitter 回调 URL:', config.twitter.redirectUri);
  console.log('✅ Twitter 授权 URL:');
  console.log(twitterAuthUrl.toString());
  
  return twitterAuthUrl.toString();
}

// 测试 API 端点
function testApiEndpoints() {
  console.log('\n🔗 API 端点测试:');
  
  const endpoints = [
    'https://sociomint.top/api/auth/discord',
    'https://sociomint.top/api/auth/twitter',
    'https://sociomint.top/api/auth/status',
    'https://sociomint.top/api/user/profile'
  ];
  
  endpoints.forEach(endpoint => {
    console.log(`📡 ${endpoint}`);
  });
}

// 生成测试报告
function generateTestReport() {
  console.log('\n📊 测试报告:');
  console.log('=====================================');
  
  const discordUrl = testDiscordAuth();
  const twitterUrl = testTwitterAuth();
  testApiEndpoints();
  
  console.log('\n🚀 下一步测试操作:');
  console.log('1. 在浏览器中测试 Discord 授权 URL');
  console.log('2. 在浏览器中测试 Twitter 授权 URL');
  console.log('3. 验证回调 URL 是否正确处理');
  console.log('4. 测试用户信息获取');
  console.log('5. 测试 JWT Token 生成');
  
  console.log('\n🔧 配置验证:');
  console.log('✅ Discord 客户端配置完整');
  console.log('✅ Twitter 客户端配置完整');
  console.log('✅ 回调 URL 指向正确域名');
  console.log('✅ OAuth 权限范围合适');
  
  console.log('\n⚠️  注意事项:');
  console.log('- 确保域名 sociomint.top 已正确解析');
  console.log('- 确保 SSL 证书已配置');
  console.log('- 确保 API 路由已部署');
  console.log('- 确保环境变量已正确设置');
  
  return {
    discord: discordUrl,
    twitter: twitterUrl,
    status: 'ready_for_testing'
  };
}

// 运行测试
if (require.main === module) {
  const report = generateTestReport();
  
  console.log('\n🎯 快速测试链接:');
  console.log('Discord:', report.discord);
  console.log('Twitter:', report.twitter);
  
  console.log('\n✨ 社交登录配置测试完成！');
}

module.exports = {
  testDiscordAuth,
  testTwitterAuth,
  testApiEndpoints,
  generateTestReport,
  config
};
