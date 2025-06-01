#!/usr/bin/env node

/**
 * SocioMint 部署就绪性检查脚本
 * 检查所有必需的配置是否完整
 */

const fs = require('fs');
const path = require('path');
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

// 检查结果统计
let checkResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  total: 0
};

function checkItem(name, condition, errorMessage = '', warningMessage = '') {
  checkResults.total++;
  
  if (condition) {
    checkResults.passed++;
    log(`✅ ${name}`, 'green');
    return true;
  } else if (warningMessage) {
    checkResults.warnings++;
    log(`⚠️  ${name} - ${warningMessage}`, 'yellow');
    return false;
  } else {
    checkResults.failed++;
    log(`❌ ${name} - ${errorMessage}`, 'red');
    return false;
  }
}

// 检查环境变量
function checkEnvironmentVariables() {
  log('\n🔍 检查环境变量配置...', 'cyan');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SM_TOKEN_ADDRESS',
    'NEXT_PUBLIC_SM_EXCHANGE_ADDRESS'
  ];
  
  const optionalEnvVars = [
    'BSC_TESTNET_PRIVATE_KEY',
    'BSCSCAN_API_KEY',
    'TELEGRAM_BOT_TOKEN',
    'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID',
    'NEXT_PUBLIC_TWITTER_CLIENT_ID',
    'TWITTER_CLIENT_SECRET',
    'NEXT_PUBLIC_DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET'
  ];
  
  // 检查必需的环境变量
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    checkItem(
      `必需环境变量: ${envVar}`,
      value && value.length > 0,
      '未设置或为空'
    );
  });
  
  // 检查可选的环境变量
  optionalEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    checkItem(
      `可选环境变量: ${envVar}`,
      value && value.length > 0,
      '',
      '未设置，某些功能可能不可用'
    );
  });
}

// 检查文件结构
function checkFileStructure() {
  log('\n🔍 检查项目文件结构...', 'cyan');
  
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'tailwind.config.js',
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'contracts/SMTokenExchangeV2.sol',
    'supabase/migrations',
    'scripts/upgrade-sm-token-exchange.js'
  ];
  
  const requiredDirs = [
    'src/components',
    'src/lib',
    'src/hooks',
    'contracts',
    'scripts',
    'supabase'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    checkItem(
      `文件: ${file}`,
      fs.existsSync(filePath),
      '文件不存在'
    );
  });
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    checkItem(
      `目录: ${dir}`,
      fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory(),
      '目录不存在'
    );
  });
}

// 检查依赖包
function checkDependencies() {
  log('\n🔍 检查项目依赖...', 'cyan');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredPackages = [
      'next',
      'react',
      'ethers',
      '@supabase/supabase-js',
      'wagmi',
      'viem',
      '@openzeppelin/contracts-upgradeable',
      'hardhat'
    ];
    
    requiredPackages.forEach(pkg => {
      checkItem(
        `依赖包: ${pkg}`,
        dependencies[pkg] !== undefined,
        '包未安装'
      );
    });
    
    // 检查 node_modules
    checkItem(
      'node_modules 目录',
      fs.existsSync('node_modules'),
      '请运行 npm install'
    );
    
  } catch (error) {
    checkItem(
      'package.json 解析',
      false,
      'package.json 文件损坏或不存在'
    );
  }
}

// 检查智能合约
function checkSmartContracts() {
  log('\n🔍 检查智能合约...', 'cyan');
  
  const contractFiles = [
    'contracts/SMTokenExchangeV2.sol',
    'contracts/AirdropPool.sol'
  ];
  
  contractFiles.forEach(contract => {
    const contractPath = path.join(process.cwd(), contract);
    if (fs.existsSync(contractPath)) {
      const content = fs.readFileSync(contractPath, 'utf8');
      
      checkItem(
        `合约文件: ${contract}`,
        content.includes('pragma solidity'),
        '不是有效的 Solidity 文件'
      );
      
      // 检查关键函数
      if (contract.includes('SMTokenExchangeV2')) {
        checkItem(
          '每日奖励函数: claimDailyFlowers',
          content.includes('claimDailyFlowers'),
          '缺少每日奖励功能'
        );
        
        checkItem(
          '升级功能: UUPS',
          content.includes('UUPSUpgradeable'),
          '缺少升级功能'
        );
      }
    } else {
      checkItem(
        `合约文件: ${contract}`,
        false,
        '文件不存在'
      );
    }
  });
}

// 检查数据库迁移
function checkDatabaseMigrations() {
  log('\n🔍 检查数据库迁移...', 'cyan');
  
  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
  
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'));
    
    checkItem(
      '数据库迁移文件',
      migrationFiles.length > 0,
      '没有找到迁移文件'
    );
    
    // 检查关键迁移
    const requiredMigrations = [
      'daily_rewards',
      'user_profiles',
      'task_system'
    ];
    
    requiredMigrations.forEach(migration => {
      const hasMigration = migrationFiles.some(file => 
        file.toLowerCase().includes(migration.toLowerCase())
      );
      
      checkItem(
        `迁移: ${migration}`,
        hasMigration,
        '缺少必要的数据库迁移'
      );
    });
    
  } else {
    checkItem(
      'supabase/migrations 目录',
      false,
      '迁移目录不存在'
    );
  }
}

// 检查构建配置
function checkBuildConfiguration() {
  log('\n🔍 检查构建配置...', 'cyan');
  
  try {
    // 检查 Next.js 配置
    const nextConfigExists = fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs');
    checkItem(
      'Next.js 配置文件',
      nextConfigExists,
      'next.config.js 或 next.config.mjs 不存在'
    );
    
    // 检查 Tailwind 配置
    checkItem(
      'Tailwind CSS 配置',
      fs.existsSync('tailwind.config.js'),
      'tailwind.config.js 不存在'
    );
    
    // 检查 TypeScript 配置
    checkItem(
      'TypeScript 配置',
      fs.existsSync('tsconfig.json'),
      'tsconfig.json 不存在'
    );
    
    // 尝试构建项目
    log('  正在测试构建过程...', 'blue');
    try {
      execSync('npm run build', { stdio: 'pipe' });
      checkItem(
        '项目构建测试',
        true,
        ''
      );
    } catch (error) {
      checkItem(
        '项目构建测试',
        false,
        '构建失败，请检查代码错误'
      );
    }
    
  } catch (error) {
    checkItem(
      '构建配置检查',
      false,
      `配置检查失败: ${error.message}`
    );
  }
}

// 检查 GitHub Actions
function checkGitHubActions() {
  log('\n🔍 检查 GitHub Actions 配置...', 'cyan');
  
  const workflowsDir = path.join(process.cwd(), '.github/workflows');
  
  if (fs.existsSync(workflowsDir)) {
    const workflowFiles = fs.readdirSync(workflowsDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
    
    checkItem(
      'GitHub Actions 工作流',
      workflowFiles.length > 0,
      '没有找到工作流文件'
    );
    
    // 检查主要工作流
    const hasTestWorkflow = workflowFiles.some(file => 
      file.toLowerCase().includes('test') || file.toLowerCase().includes('ci')
    );
    
    checkItem(
      '测试工作流',
      hasTestWorkflow,
      '缺少测试工作流'
    );
    
  } else {
    checkItem(
      '.github/workflows 目录',
      false,
      'GitHub Actions 目录不存在'
    );
  }
}

// 生成部署建议
function generateDeploymentSuggestions() {
  log('\n📋 部署建议:', 'cyan');
  
  if (checkResults.failed > 0) {
    log('🔴 关键问题需要解决:', 'red');
    log('  - 请修复所有标记为 ❌ 的问题', 'red');
    log('  - 确保所有必需的环境变量已配置', 'red');
    log('  - 验证智能合约和数据库迁移完整性', 'red');
  }
  
  if (checkResults.warnings > 0) {
    log('🟡 建议优化项:', 'yellow');
    log('  - 配置可选的环境变量以启用完整功能', 'yellow');
    log('  - 设置监控和分析工具', 'yellow');
    log('  - 完善 GitHub Actions 配置', 'yellow');
  }
  
  if (checkResults.failed === 0) {
    log('🟢 部署就绪建议:', 'green');
    log('  1. 在测试网部署和测试所有功能', 'green');
    log('  2. 进行安全审计', 'green');
    log('  3. 设置监控和告警', 'green');
    log('  4. 准备主网部署', 'green');
  }
}

// 主函数
function main() {
  log('🚀 SocioMint 部署就绪性检查', 'bright');
  log('=' * 50, 'cyan');
  
  // 执行所有检查
  checkEnvironmentVariables();
  checkFileStructure();
  checkDependencies();
  checkSmartContracts();
  checkDatabaseMigrations();
  checkBuildConfiguration();
  checkGitHubActions();
  
  // 输出检查结果
  log('\n📊 检查结果统计:', 'cyan');
  log('=' * 30, 'cyan');
  log(`✅ 通过: ${checkResults.passed}`, 'green');
  log(`❌ 失败: ${checkResults.failed}`, 'red');
  log(`⚠️  警告: ${checkResults.warnings}`, 'yellow');
  log(`📋 总计: ${checkResults.total}`, 'blue');
  
  const successRate = ((checkResults.passed / checkResults.total) * 100).toFixed(1);
  log(`📈 成功率: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  
  // 生成建议
  generateDeploymentSuggestions();
  
  // 输出最终状态
  log('\n🎯 部署就绪状态:', 'cyan');
  if (checkResults.failed === 0) {
    log('✅ 项目已准备好部署！', 'green');
    process.exit(0);
  } else {
    log('❌ 项目尚未准备好部署，请修复上述问题。', 'red');
    process.exit(1);
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  log(`💥 未捕获的异常: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 未处理的 Promise 拒绝: ${reason}`, 'red');
  process.exit(1);
});

// 运行检查
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkEnvironmentVariables,
  checkFileStructure,
  checkDependencies,
  checkSmartContracts,
  checkDatabaseMigrations,
  checkBuildConfiguration,
  checkGitHubActions
};
