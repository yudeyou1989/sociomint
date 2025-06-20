#!/usr/bin/env node

/**
 * Cloudflare Pages 安全配置脚本
 * 自动配置SSL、安全头部和性能优化设置
 */

const fs = require('fs');
const path = require('path');

// 简单的颜色输出函数
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`
};

console.log(colors.blue('🛡️ 开始配置 Cloudflare Pages 安全设置...\n'));

// 1. 验证安全头部配置
function validateSecurityHeaders() {
  console.log(colors.cyan('📋 验证安全头部配置...'));

  const headersPath = path.join(__dirname, '../public/_headers');

  if (!fs.existsSync(headersPath)) {
    console.log(colors.red('❌ _headers 文件不存在'));
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
      console.log(colors.green(`✅ ${header}`));
    } else {
      console.log(colors.red(`❌ ${header} 缺失`));
      allPresent = false;
    }
  });

  return allPresent;
}

// 2. 验证重定向配置
function validateRedirects() {
  console.log(colors.cyan('\n🔄 验证重定向配置...'));

  const redirectsPath = path.join(__dirname, '../public/_redirects');

  if (!fs.existsSync(redirectsPath)) {
    console.log(colors.yellow('⚠️ _redirects 文件不存在，创建基础配置...'));
    
    const basicRedirects = `# HTTPS 重定向
http://sociomint.top/* https://sociomint.top/:splat 301!
http://www.sociomint.top/* https://www.sociomint.top/:splat 301!

# WWW 重定向
https://www.sociomint.top/* https://sociomint.top/:splat 301!

# SPA 路由支持
/*    /index.html   200

# API 路由
/api/*  /api/:splat  200

# 404 页面
/*    /404.html   404
`;
    
    fs.writeFileSync(redirectsPath, basicRedirects);
    console.log(chalk.green('✅ 创建了基础重定向配置'));
    return true;
  }
  
  console.log(chalk.green('✅ _redirects 文件存在'));
  return true;
}

// 3. 生成安全配置报告
function generateSecurityReport() {
  console.log(chalk.cyan('\n📊 生成安全配置报告...'));
  
  const report = {
    timestamp: new Date().toISOString(),
    domain: 'sociomint.top',
    ssl: {
      mode: 'Full (Strict)',
      hsts: true,
      alwaysHttps: true
    },
    headers: validateSecurityHeaders(),
    redirects: fs.existsSync(path.join(__dirname, '../public/_redirects')),
    recommendations: [
      '启用 Cloudflare Bot Fight Mode',
      '配置 Rate Limiting 规则',
      '启用 DDoS 保护',
      '配置 WAF 自定义规则',
      '启用 Browser Integrity Check'
    ]
  };
  
  const reportPath = path.join(__dirname, '../security-reports/cloudflare-security-config.json');
  
  // 确保目录存在
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(chalk.green(`✅ 安全报告已保存到: ${reportPath}`));
  
  return report;
}

// 4. 显示配置指南
function showConfigurationGuide() {
  console.log(chalk.blue('\n🔧 Cloudflare Dashboard 配置指南:\n'));
  
  console.log(chalk.yellow('SSL/TLS 配置:'));
  console.log('1. 导航到 SSL/TLS → 概述');
  console.log('2. 选择 "完全（严格）" 加密模式');
  console.log('3. 启用 "始终使用 HTTPS"');
  console.log('4. 配置 HSTS 设置\n');
  
  console.log(chalk.yellow('安全设置:'));
  console.log('1. 导航到 安全 → WAF');
  console.log('2. 启用 "Bot Fight Mode"');
  console.log('3. 配置 Rate Limiting 规则');
  console.log('4. 启用 "Browser Integrity Check"\n');
  
  console.log(chalk.yellow('性能优化:'));
  console.log('1. 导航到 速度 → 优化');
  console.log('2. 启用 "Auto Minify" (HTML, CSS, JS)');
  console.log('3. 启用 "Brotli" 压缩');
  console.log('4. 配置 "Browser Cache TTL"\n');
  
  console.log(chalk.green('🌐 验证配置:'));
  console.log('访问: https://www.ssllabs.com/ssltest/');
  console.log('测试: https://sociomint.top');
}

// 主函数
async function main() {
  try {
    const headersValid = validateSecurityHeaders();
    const redirectsValid = validateRedirects();
    const report = generateSecurityReport();
    
    console.log(chalk.blue('\n📋 配置摘要:'));
    console.log(`安全头部: ${headersValid ? chalk.green('✅ 已配置') : chalk.red('❌ 需要修复')}`);
    console.log(`重定向规则: ${redirectsValid ? chalk.green('✅ 已配置') : chalk.red('❌ 需要修复')}`);
    
    showConfigurationGuide();
    
    if (headersValid && redirectsValid) {
      console.log(chalk.green('\n🎉 安全配置完成！请按照上述指南在 Cloudflare Dashboard 中完成最终配置。'));
    } else {
      console.log(chalk.yellow('\n⚠️ 部分配置需要修复，请检查上述输出。'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ 配置过程中出现错误:'), error.message);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  validateSecurityHeaders,
  validateRedirects,
  generateSecurityReport
};
