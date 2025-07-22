/**
 * 生产环境配置验证脚本
 * 验证所有生产环境配置是否正确
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

// 必需的环境变量
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID',
  'NEXT_PUBLIC_SM_TOKEN_ADDRESS',
  'NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID'
];

// 可选的环境变量
const OPTIONAL_ENV_VARS = [
  'TWITTER_CLIENT_ID',
  'TWITTER_CLIENT_SECRET',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'BSCSCAN_API_KEY',
  'PRIVATE_KEY'
];

// 验证结果
const validationResults = {
  errors: [],
  warnings: [],
  info: []
};

// 检查文件是否存在
function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    log.success(`${description} 存在: ${filePath}`);
    return true;
  } else {
    log.error(`${description} 不存在: ${filePath}`);
    validationResults.errors.push(`缺少文件: ${filePath}`);
    return false;
  }
}

// 检查环境变量
function checkEnvironmentVariables() {
  log.info('检查环境变量配置...');
  
  // 检查 .env.example 文件
  if (!checkFileExists('.env.example', '环境变量示例文件')) {
    return;
  }

  // 读取 .env.example 内容
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');

  // 检查必需的环境变量
  REQUIRED_ENV_VARS.forEach(varName => {
    if (envExampleContent.includes(`${varName}=`)) {
      log.success(`必需环境变量已定义: ${varName}`);
    } else {
      log.error(`缺少必需环境变量: ${varName}`);
      validationResults.errors.push(`缺少必需环境变量: ${varName}`);
    }
  });

  // 检查可选的环境变量
  OPTIONAL_ENV_VARS.forEach(varName => {
    if (envExampleContent.includes(`${varName}=`)) {
      log.info(`可选环境变量已定义: ${varName}`);
    } else {
      log.warning(`可选环境变量未定义: ${varName}`);
      validationResults.warnings.push(`可选环境变量未定义: ${varName}`);
    }
  });

  // 检查是否有真实的密钥值（安全检查）
  const sensitivePatterns = [
    /PRIVATE_KEY=0x[a-fA-F0-9]{64}/,
    /API_KEY=[a-zA-Z0-9]{32,}/,
    /SECRET=[a-zA-Z0-9]{32,}/,
    /TOKEN=[a-zA-Z0-9]{32,}/
  ];

  sensitivePatterns.forEach(pattern => {
    if (pattern.test(envExampleContent)) {
      log.error('⚠️  .env.example 包含真实的敏感信息！');
      validationResults.errors.push('.env.example 不应包含真实的敏感信息');
    }
  });
}

// 检查Next.js配置
function checkNextConfig() {
  log.info('检查Next.js配置...');
  
  if (!checkFileExists('next.config.ts', 'Next.js配置文件')) {
    return;
  }

  const configPath = path.join(process.cwd(), 'next.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');

  // 检查关键配置
  const requiredConfigs = [
    { key: 'output: "export"', description: '静态导出配置' },
    { key: 'trailingSlash: true', description: '尾部斜杠配置' },
    { key: 'images:', description: '图片配置' },
    { key: 'eslint:', description: 'ESLint配置' },
    { key: 'typescript:', description: 'TypeScript配置' }
  ];

  requiredConfigs.forEach(config => {
    if (configContent.includes(config.key)) {
      log.success(`${config.description} 已配置`);
    } else {
      log.warning(`${config.description} 可能缺失`);
      validationResults.warnings.push(`${config.description} 可能缺失`);
    }
  });

  // 检查生产环境优化
  if (configContent.includes('ignoreDuringBuilds: true')) {
    log.warning('ESLint在构建时被忽略 - 生产环境建议启用');
    validationResults.warnings.push('ESLint在构建时被忽略');
  }

  if (configContent.includes('ignoreBuildErrors: true')) {
    log.warning('TypeScript错误在构建时被忽略 - 生产环境建议启用');
    validationResults.warnings.push('TypeScript错误在构建时被忽略');
  }
}

// 检查package.json
function checkPackageJson() {
  log.info('检查package.json配置...');
  
  if (!checkFileExists('package.json', 'Package配置文件')) {
    return;
  }

  const packagePath = path.join(process.cwd(), 'package.json');
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  // 检查必需的脚本
  const requiredScripts = [
    'build',
    'start',
    'dev',
    'lint',
    'type-check'
  ];

  requiredScripts.forEach(script => {
    if (packageContent.scripts && packageContent.scripts[script]) {
      log.success(`脚本已定义: ${script}`);
    } else {
      log.error(`缺少必需脚本: ${script}`);
      validationResults.errors.push(`缺少必需脚本: ${script}`);
    }
  });

  // 检查关键依赖
  const requiredDependencies = [
    'next',
    'react',
    'react-dom',
    'ethers',
    '@wagmi/core'
  ];

  requiredDependencies.forEach(dep => {
    if (packageContent.dependencies && packageContent.dependencies[dep]) {
      log.success(`关键依赖已安装: ${dep}`);
    } else {
      log.error(`缺少关键依赖: ${dep}`);
      validationResults.errors.push(`缺少关键依赖: ${dep}`);
    }
  });
}

// 检查TypeScript配置
function checkTypeScriptConfig() {
  log.info('检查TypeScript配置...');
  
  if (!checkFileExists('tsconfig.json', 'TypeScript配置文件')) {
    return;
  }

  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  const tsconfigContent = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

  // 检查关键配置
  const requiredConfigs = [
    { path: 'compilerOptions.strict', value: true, description: '严格模式' },
    { path: 'compilerOptions.noEmit', value: true, description: '不输出文件' },
    { path: 'compilerOptions.esModuleInterop', value: true, description: 'ES模块互操作' },
    { path: 'compilerOptions.moduleResolution', value: 'node', description: '模块解析' }
  ];

  requiredConfigs.forEach(config => {
    const value = config.path.split('.').reduce((obj, key) => obj?.[key], tsconfigContent);
    if (value === config.value) {
      log.success(`TypeScript配置正确: ${config.description}`);
    } else {
      log.warning(`TypeScript配置可能不正确: ${config.description}`);
      validationResults.warnings.push(`TypeScript配置: ${config.description}`);
    }
  });
}

// 检查安全配置
function checkSecurityConfig() {
  log.info('检查安全配置...');
  
  // 检查安全头部配置
  if (checkFileExists('public/_headers', '安全头部配置文件')) {
    const headersPath = path.join(process.cwd(), 'public/_headers');
    const headersContent = fs.readFileSync(headersPath, 'utf8');

    const securityHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Content-Security-Policy'
    ];

    securityHeaders.forEach(header => {
      if (headersContent.includes(header)) {
        log.success(`安全头部已配置: ${header}`);
      } else {
        log.warning(`缺少安全头部: ${header}`);
        validationResults.warnings.push(`缺少安全头部: ${header}`);
      }
    });
  }

  // 检查.gitignore
  if (checkFileExists('.gitignore', 'Git忽略文件')) {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'private-keys',
      '*.key'
    ];

    sensitiveFiles.forEach(file => {
      if (gitignoreContent.includes(file)) {
        log.success(`敏感文件已忽略: ${file}`);
      } else {
        log.error(`敏感文件未忽略: ${file}`);
        validationResults.errors.push(`敏感文件未忽略: ${file}`);
      }
    });
  }
}

// 检查构建输出
function checkBuildOutput() {
  log.info('检查构建输出...');
  
  const outDir = path.join(process.cwd(), 'out');
  if (fs.existsSync(outDir)) {
    log.success('构建输出目录存在');
    
    // 检查关键文件
    const requiredFiles = [
      'index.html',
      '_next/static'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(outDir, file);
      if (fs.existsSync(filePath)) {
        log.success(`构建文件存在: ${file}`);
      } else {
        log.warning(`构建文件缺失: ${file}`);
        validationResults.warnings.push(`构建文件缺失: ${file}`);
      }
    });
  } else {
    log.warning('构建输出目录不存在 - 请先运行 npm run build');
    validationResults.warnings.push('需要先构建项目');
  }
}

// 检查Cloudflare配置
function checkCloudflareConfig() {
  log.info('检查Cloudflare配置...');
  
  // 检查wrangler.toml（如果使用Cloudflare Workers）
  const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
  if (fs.existsSync(wranglerPath)) {
    log.info('发现Cloudflare Workers配置');
    // 可以添加更多wrangler配置检查
  }

  // 检查_redirects文件
  if (checkFileExists('public/_redirects', 'Cloudflare重定向配置')) {
    log.success('Cloudflare重定向配置存在');
  }
}

// 生成报告
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 生产环境配置验证报告');
  console.log('='.repeat(60));

  if (validationResults.errors.length === 0) {
    log.success('✨ 没有发现严重错误！');
  } else {
    log.error(`发现 ${validationResults.errors.length} 个严重错误:`);
    validationResults.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
  }

  if (validationResults.warnings.length > 0) {
    log.warning(`发现 ${validationResults.warnings.length} 个警告:`);
    validationResults.warnings.forEach(warning => {
      console.log(`   • ${warning}`);
    });
  }

  if (validationResults.info.length > 0) {
    log.info(`信息提示 ${validationResults.info.length} 条:`);
    validationResults.info.forEach(info => {
      console.log(`   • ${info}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  if (validationResults.errors.length === 0) {
    log.success('🚀 项目已准备好部署到生产环境！');
    return true;
  } else {
    log.error('❌ 请修复所有错误后再部署到生产环境！');
    return false;
  }
}

// 主函数
function main() {
  console.log('🔍 开始验证生产环境配置...\n');

  checkEnvironmentVariables();
  checkNextConfig();
  checkPackageJson();
  checkTypeScriptConfig();
  checkSecurityConfig();
  checkBuildOutput();
  checkCloudflareConfig();

  const isReady = generateReport();
  process.exit(isReady ? 0 : 1);
}

// 运行验证
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  checkNextConfig,
  checkPackageJson,
  checkTypeScriptConfig,
  checkSecurityConfig,
  checkBuildOutput,
  checkCloudflareConfig,
  generateReport
};
