#!/usr/bin/env node

/**
 * GitHub Secrets 自动配置脚本
 * 帮助用户配置所有必需的 GitHub Secrets
 */

const readline = require('readline');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 创建输入接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提示用户输入
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// 验证 GitHub CLI 是否安装
function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// 设置 GitHub Secret
function setGitHubSecret(name, value, repo) {
  try {
    const command = `gh secret set ${name} --body "${value}" --repo ${repo}`;
    execSync(command, { stdio: 'pipe' });
    log(`✅ 已设置 Secret: ${name}`, 'green');
    return true;
  } catch (error) {
    log(`❌ 设置 Secret 失败: ${name} - ${error.message}`, 'red');
    return false;
  }
}

// 主要配置流程
async function main() {
  log('🔐 GitHub Secrets 配置向导', 'bright');
  log('=' * 50, 'cyan');
  
  // 检查 GitHub CLI
  if (!checkGitHubCLI()) {
    log('❌ 未检测到 GitHub CLI，请先安装:', 'red');
    log('   macOS: brew install gh', 'yellow');
    log('   Windows: winget install GitHub.cli', 'yellow');
    log('   Linux: 参考 https://cli.github.com/manual/installation', 'yellow');
    process.exit(1);
  }
  
  log('✅ GitHub CLI 已安装', 'green');
  
  // 获取仓库信息
  const repo = await askQuestion('请输入 GitHub 仓库 (格式: username/repository): ');
  if (!repo.includes('/')) {
    log('❌ 仓库格式错误，应为: username/repository', 'red');
    process.exit(1);
  }
  
  log(`\n📋 将为仓库 ${repo} 配置 Secrets`, 'blue');
  
  // 已知的配置值
  const knownSecrets = {
    'NEXT_PUBLIC_SUPABASE_URL': 'https://kiyyhitozmezuppziomx.supabase.co',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTA4NjgsImV4cCI6MjA1OTI2Njg2OH0.djjofAxZdg7EeRUixmhUomMOyIDkKU0exxhkW_PtBrg',
    'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXloaXRvem1lenVwcHppb214Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzY5MDg2OCwiZXhwIjoyMDU5MjY2ODY4fQ.PpStjkjA6zTgSJUrbhA7HFr3WCRokV5E7G3gC6Idr-c',
    'NEXT_PUBLIC_SM_TOKEN_ADDRESS': '0xd7d7dd989642222B6f685aF0220dc0065F489ae0',
    'NEXT_PUBLIC_SM_EXCHANGE_ADDRESS': '0xF0c4729f07d7B2F03E2E2F2feED36386Dc8bFb8E',
    'BSCSCAN_API_KEY': 'E6E9MC7X4VVGVQYJ2S1Q8ZVZMV2TJ377I8',
    'TELEGRAM_BOT_TOKEN': '7560632858:AAF_gn5n9I-5NeSI1xnqYGcatVkbXR6Vx6s',
    'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID': 'fced525820007c9c024132cf432ffcae',
    'NEXT_PUBLIC_DISCORD_CLIENT_ID': '1377572072602996797',
    'SENTRY_DSN': 'https://2aaad66dfe93bd62b56671d84bf544bd@o4509406316658688.ingest.de.sentry.io/4509406467391568',
    'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID': 'G-S1WC84RZQR'
  };
  
  // 设置已知的 Secrets
  log('\n🔧 设置已知配置...', 'cyan');
  let successCount = 0;
  
  for (const [name, value] of Object.entries(knownSecrets)) {
    if (setGitHubSecret(name, value, repo)) {
      successCount++;
    }
  }
  
  log(`\n✅ 已设置 ${successCount}/${Object.keys(knownSecrets).length} 个已知配置`, 'green');
  
  // 需要用户输入的 Secrets
  const userSecrets = [
    {
      name: 'BSC_TESTNET_PRIVATE_KEY',
      description: 'BSC 测试网私钥 (不包含 0x 前缀)',
      required: true,
      sensitive: true
    },
    {
      name: 'NEXT_PUBLIC_TWITTER_CLIENT_ID',
      description: 'Twitter OAuth 2.0 Client ID',
      required: true,
      sensitive: false
    },
    {
      name: 'TWITTER_CLIENT_SECRET',
      description: 'Twitter OAuth 2.0 Client Secret',
      required: true,
      sensitive: true
    },
    {
      name: 'DISCORD_CLIENT_SECRET',
      description: 'Discord Client Secret',
      required: true,
      sensitive: true
    },
    {
      name: 'BSC_MAINNET_PRIVATE_KEY',
      description: 'BSC 主网私钥 (生产环境，可选)',
      required: false,
      sensitive: true
    },
    {
      name: 'cloudflare_TOKEN',
      description: 'cloudflare 部署令牌 (可选)',
      required: false,
      sensitive: true
    },
    {
      name: 'cloudflare_ORG_ID',
      description: 'cloudflare 组织 ID (可选)',
      required: false,
      sensitive: false
    },
    {
      name: 'cloudflare_PROJECT_ID',
      description: 'cloudflare 项目 ID (可选)',
      required: false,
      sensitive: false
    }
  ];
  
  // 收集用户输入
  log('\n📝 请提供以下配置信息...', 'cyan');
  
  for (const secret of userSecrets) {
    const requiredText = secret.required ? '(必需)' : '(可选)';
    const sensitiveText = secret.sensitive ? '⚠️  敏感信息' : '';
    
    log(`\n${secret.name} ${requiredText} ${sensitiveText}`, 'yellow');
    log(`描述: ${secret.description}`, 'blue');
    
    const value = await askQuestion('请输入值 (留空跳过): ');
    
    if (value) {
      if (setGitHubSecret(secret.name, value, repo)) {
        successCount++;
      }
    } else if (secret.required) {
      log(`⚠️  跳过必需配置: ${secret.name}`, 'yellow');
    }
  }
  
  // 配置总结
  log('\n📊 配置总结:', 'cyan');
  log('=' * 30, 'cyan');
  log(`✅ 成功配置的 Secrets: ${successCount}`, 'green');
  
  // 验证配置
  log('\n🔍 验证配置...', 'cyan');
  try {
    const secretsList = execSync(`gh secret list --repo ${repo}`, { encoding: 'utf8' });
    log('当前配置的 Secrets:', 'blue');
    console.log(secretsList);
  } catch (error) {
    log('❌ 无法获取 Secrets 列表', 'red');
  }
  
  // 下一步指导
  log('\n🎯 下一步操作:', 'cyan');
  log('1. 检查 GitHub Actions 是否正常运行', 'blue');
  log('2. 完成 Twitter OAuth 2.0 配置 (如果尚未完成)', 'blue');
  log('3. 获取 Discord Client Secret', 'blue');
  log('4. 测试部署流程', 'blue');
  
  // 重要提醒
  log('\n⚠️  重要提醒:', 'yellow');
  log('- 私钥信息已加密存储在 GitHub', 'yellow');
  log('- 定期检查和更新 API 密钥', 'yellow');
  log('- 不要在代码中硬编码敏感信息', 'yellow');
  
  rl.close();
  log('\n🎉 GitHub Secrets 配置完成！', 'green');
}

// 错误处理
process.on('uncaughtException', (error) => {
  log(`💥 未捕获的异常: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 未处理的 Promise 拒绝: ${reason}`, 'red');
  rl.close();
  process.exit(1);
});

// SIGINT 处理 (Ctrl+C)
process.on('SIGINT', () => {
  log('\n\n👋 配置已取消', 'yellow');
  rl.close();
  process.exit(0);
});

// 运行配置
if (require.main === module) {
  main().catch((error) => {
    log(`💥 配置失败: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
  });
}

module.exports = { main, setGitHubSecret, checkGitHubCLI };
