#!/usr/bin/env node

/**
 * 环境变量管理脚本
 * 用于处理多环境配置和验证环境变量
 * 
 * 使用方法:
 *   node scripts/manage-env-vars.js --action=validate
 *   node scripts/manage-env-vars.js --action=sync --env=production
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const chalk = require('chalk');

// 命令行参数解析
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  acc[key] = value;
  return acc;
}, {});

// 必需的环境变量
const REQUIRED_VARS = {
  all: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY'
  ],
  development: [
    'NEXT_PUBLIC_DEVELOPMENT_MODE'
  ],
  production: [
    'NEXT_PUBLIC_SM_TOKEN_ADDRESS',
    'NEXT_PUBLIC_FLOWER_EXCHANGE_ADDRESS',
    'NEXT_PUBLIC_BSC_RPC_URL'
  ]
};

// 不同目标环境的环境变量文件
const ENV_FILES = {
  development: '.env.development',
  production: '.env.production',
  local: '.env.local'
};

// 验证环境变量是否存在
function validateEnvVars(env = 'development') {
  console.log(chalk.blue(`验证${env}环境的环境变量...`));
  
  // 加载环境变量
  const envPath = path.resolve(process.cwd(), ENV_FILES[env]);
  let envVars = {};
  
  try {
    if (fs.existsSync(envPath)) {
      envVars = dotenv.parse(fs.readFileSync(envPath));
    } else {
      console.log(chalk.yellow(`警告: ${ENV_FILES[env]} 文件不存在`));
    }
  } catch (error) {
    console.error(chalk.red(`读取 ${ENV_FILES[env]} 文件失败:`, error));
    process.exit(1);
  }
  
  // 验证所有必需的环境变量
  const requiredVars = [...REQUIRED_VARS.all, ...(REQUIRED_VARS[env] || [])];
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!envVars[varName] && !process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.error(chalk.red(`错误: 以下环境变量缺失: ${missingVars.join(', ')}`));
    return false;
  }
  
  console.log(chalk.green(`环境变量验证通过!`));
  return true;
}

// 同步环境变量到Vercel
async function syncEnvToVercel(env = 'development') {
  console.log(chalk.blue(`正在将${env}环境变量同步到Vercel...`));
  
  // 检查Vercel CLI是否已安装
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.error(chalk.red('错误: Vercel CLI 未安装。请运行 npm i -g vercel 安装它。'));
    process.exit(1);
  }
  
  // 加载环境变量
  const envPath = path.resolve(process.cwd(), ENV_FILES[env]);
  let envVars = {};
  
  try {
    if (fs.existsSync(envPath)) {
      envVars = dotenv.parse(fs.readFileSync(envPath));
    } else {
      console.error(chalk.red(`错误: ${ENV_FILES[env]} 文件不存在`));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`读取 ${ENV_FILES[env]} 文件失败:`, error));
    process.exit(1);
  }
  
  // 同步到 Vercel
  try {
    console.log(chalk.blue('正在将环境变量推送到 Vercel...'));
    
    for (const [key, value] of Object.entries(envVars)) {
      // 跳过空值
      if (!value) continue;
      
      // 使用 Vercel CLI 设置环境变量
      console.log(`设置 ${key}...`);
      execSync(`vercel env add ${key} ${env}`, {
        stdio: 'pipe',
        input: Buffer.from(value)
      });
    }
    
    console.log(chalk.green('环境变量已成功同步到 Vercel!'));
    console.log(chalk.yellow('注意: 您可能需要重新部署项目以使更改生效。'));
  } catch (error) {
    console.error(chalk.red('同步环境变量到 Vercel 失败:', error.message));
    process.exit(1);
  }
}

// 为新环境创建环境变量文件
function createEnvFile(env) {
  console.log(chalk.blue(`正在为 ${env} 环境创建环境变量文件...`));
  
  const templatePath = path.resolve(process.cwd(), '.env.template');
  const targetPath = path.resolve(process.cwd(), ENV_FILES[env]);
  
  if (!fs.existsSync(templatePath)) {
    console.error(chalk.red('错误: .env.template 文件不存在'));
    process.exit(1);
  }
  
  if (fs.existsSync(targetPath)) {
    console.error(chalk.yellow(`警告: ${ENV_FILES[env]} 文件已存在，跳过创建`));
    return;
  }
  
  try {
    fs.copyFileSync(templatePath, targetPath);
    console.log(chalk.green(`${ENV_FILES[env]} 文件已创建`));
    console.log(chalk.yellow('请编辑该文件并填写适当的值'));
  } catch (error) {
    console.error(chalk.red(`创建 ${ENV_FILES[env]} 文件失败:`, error));
    process.exit(1);
  }
}

// 检查源代码中的硬编码环境变量
function checkHardcodedEnvVars() {
  console.log(chalk.blue('检查代码中的硬编码环境变量...'));
  
  try {
    // 使用 grep 查找可能的硬编码环境变量
    const result = execSync('grep -r "process.env." --include="*.js" --include="*.ts" --include="*.tsx" --include="*.jsx" src', { encoding: 'utf8' });
    
    // 解析结果并检查是否有任何直接字符串比较
    const suspiciousPatterns = [
      /process\.env\.[A-Z_]+ === ['"][^'"]+['"]/,
      /process\.env\.[A-Z_]+ !== ['"][^'"]+['"]/,
      /process\.env\.[A-Z_]+ == ['"][^'"]+['"]/,
      /process\.env\.[A-Z_]+ != ['"][^'"]+['"]/
    ];
    
    const lines = result.split('\n');
    const suspiciousLines = lines.filter(line => 
      suspiciousPatterns.some(pattern => pattern.test(line))
    );
    
    if (suspiciousLines.length > 0) {
      console.log(chalk.yellow('警告: 发现可能的硬编码环境变量比较:'));
      suspiciousLines.forEach(line => console.log(`  ${line.trim()}`));
      console.log(chalk.yellow('建议使用配置文件或在构建时注入这些值'));
    } else {
      console.log(chalk.green('未发现可疑的硬编码环境变量!'));
    }
  } catch (error) {
    if (error.status === 1) {
      console.log(chalk.green('未发现环境变量的使用!'));
    } else {
      console.error(chalk.red('检查硬编码环境变量失败:', error));
    }
  }
}

// 创建环境变量模板文件
function createEnvTemplate() {
  console.log(chalk.blue('创建环境变量模板文件...'));
  
  const templatePath = path.resolve(process.cwd(), '.env.template');
  
  if (fs.existsSync(templatePath)) {
    console.log(chalk.yellow('警告: .env.template 文件已存在，跳过创建'));
    return;
  }
  
  try {
    // 收集所有必需的环境变量
    const allRequiredVars = new Set([
      ...REQUIRED_VARS.all,
      ...REQUIRED_VARS.development,
      ...REQUIRED_VARS.production
    ]);
    
    // 创建模板文件内容
    let templateContent = `# SocioMint 环境变量模板\n`;
    templateContent += `# 复制此文件并重命名为适当的环境文件: .env.development, .env.production\n\n`;
    
    allRequiredVars.forEach(varName => {
      templateContent += `${varName}=\n`;
    });
    
    fs.writeFileSync(templatePath, templateContent);
    console.log(chalk.green('.env.template 文件已创建'));
  } catch (error) {
    console.error(chalk.red('创建环境变量模板文件失败:', error));
    process.exit(1);
  }
}

// 主函数
async function main() {
  const action = args.action || 'validate';
  const env = args.env || 'development';
  
  switch (action) {
    case 'validate':
      validateEnvVars(env);
      break;
    case 'sync':
      if (validateEnvVars(env)) {
        await syncEnvToVercel(env);
      }
      break;
    case 'create':
      createEnvFile(env);
      break;
    case 'check':
      checkHardcodedEnvVars();
      break;
    case 'template':
      createEnvTemplate();
      break;
    default:
      console.error(chalk.red(`错误: 未知操作 ${action}`));
      console.log(`支持的操作: validate, sync, create, check, template`);
      process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red('执行脚本时发生错误:', error));
  process.exit(1);
}); 