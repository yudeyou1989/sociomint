#!/usr/bin/env node

/**
 * 简化版安全配置检查脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🛡️ 开始检查 Cloudflare Pages 安全配置...\n');

// 1. 检查安全头部
function checkSecurityHeaders() {
  console.log('📋 检查安全头部配置...');
  
  const headersPath = path.join(__dirname, '../public/_headers');
  
  if (!fs.existsSync(headersPath)) {
    console.log('❌ _headers 文件不存在');
    return false;
  }
  
  const headers = fs.readFileSync(headersPath, 'utf8');
  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options', 
    'X-XSS-Protection',
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'Referrer-Policy'
  ];
  
  let allPresent = true;
  requiredHeaders.forEach(header => {
    if (headers.includes(header)) {
      console.log(`✅ ${header}`);
    } else {
      console.log(`❌ ${header} 缺失`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

// 2. 检查重定向配置
function checkRedirects() {
  console.log('\n🔄 检查重定向配置...');
  
  const redirectsPath = path.join(__dirname, '../public/_redirects');
  
  if (!fs.existsSync(redirectsPath)) {
    console.log('❌ _redirects 文件不存在');
    return false;
  }
  
  const redirects = fs.readFileSync(redirectsPath, 'utf8');
  
  // 检查关键重定向规则
  const checks = [
    { pattern: 'https://', desc: 'HTTPS 重定向' },
    { pattern: '301!', desc: '强制重定向' },
    { pattern: '/index.html', desc: 'SPA 路由支持' }
  ];
  
  let allPresent = true;
  checks.forEach(check => {
    if (redirects.includes(check.pattern)) {
      console.log(`✅ ${check.desc}`);
    } else {
      console.log(`❌ ${check.desc} 缺失`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

// 3. 生成配置指南
function showConfigGuide() {
  console.log('\n🔧 Cloudflare Dashboard 配置步骤:\n');
  
  console.log('SSL/TLS 配置:');
  console.log('1. 进入 SSL/TLS → 概述');
  console.log('2. 选择 "完全（严格）" 模式');
  console.log('3. 启用 "始终使用 HTTPS"');
  console.log('4. 配置 HSTS: 最大年龄 6个月，包含子域名\n');
  
  console.log('安全设置:');
  console.log('1. 进入 安全 → WAF');
  console.log('2. 启用 "Bot Fight Mode"');
  console.log('3. 启用 "Browser Integrity Check"');
  console.log('4. 配置 Rate Limiting (可选)\n');
  
  console.log('性能优化:');
  console.log('1. 进入 速度 → 优化');
  console.log('2. 启用 "Auto Minify" (HTML, CSS, JS)');
  console.log('3. 启用 "Brotli" 压缩');
  console.log('4. 设置 "Browser Cache TTL" 为 4小时\n');
  
  console.log('验证工具:');
  console.log('• SSL 测试: https://www.ssllabs.com/ssltest/');
  console.log('• 安全头部: https://securityheaders.com/');
  console.log('• 性能测试: https://pagespeed.web.dev/');
}

// 主函数
function main() {
  const headersOk = checkSecurityHeaders();
  const redirectsOk = checkRedirects();
  
  console.log('\n📊 配置状态:');
  console.log(`安全头部: ${headersOk ? '✅ 已配置' : '❌ 需要修复'}`);
  console.log(`重定向规则: ${redirectsOk ? '✅ 已配置' : '❌ 需要修复'}`);
  
  showConfigGuide();
  
  if (headersOk && redirectsOk) {
    console.log('\n🎉 本地配置检查完成！请在 Cloudflare Dashboard 中完成最终设置。');
  } else {
    console.log('\n⚠️ 发现配置问题，请检查上述输出并修复。');
  }
}

// 运行检查
main();
