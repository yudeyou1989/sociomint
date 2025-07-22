/**
 * 直接检查脚本 - 不依赖npm run命令
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`)
};

// 测试结果
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function addTest(name, passed, message = '') {
  results.total++;
  if (passed) {
    results.passed++;
    log.success(`${name}: ${message || '通过'}`);
  } else {
    results.failed++;
    log.error(`${name}: ${message || '失败'}`);
  }
  results.tests.push({ name, passed, message });
}

// 检查文件是否存在
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  addTest(description, exists, exists ? '存在' : '不存在');
  return exists;
}

// 检查JSON文件
function checkJsonFile(filePath, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    addTest(description, true, '格式正确');
    return true;
  } catch (error) {
    addTest(description, false, `格式错误: ${error.message}`);
    return false;
  }
}

// 检查TypeScript配置
function checkTypeScript() {
  log.test('检查TypeScript配置...');
  
  // 检查tsconfig.json
  if (checkJsonFile('tsconfig.json', 'TypeScript配置文件')) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
      addTest('TypeScript严格模式', tsconfig.compilerOptions?.strict === true);
      addTest('TypeScript模块解析', tsconfig.compilerOptions?.moduleResolution === 'node');
    } catch (error) {
      addTest('TypeScript配置解析', false, error.message);
    }
  }
  
  // 检查类型定义文件
  checkFile('src/types', 'TypeScript类型定义目录');
}

// 检查Next.js配置
function checkNextJs() {
  log.test('检查Next.js配置...');
  
  checkFile('next.config.ts', 'Next.js配置文件');
  
  if (fs.existsSync('next.config.ts')) {
    try {
      const configContent = fs.readFileSync('next.config.ts', 'utf8');
      addTest('静态导出配置', configContent.includes('output:') && configContent.includes('export'));
      addTest('图片配置', configContent.includes('images:'));
    } catch (error) {
      addTest('Next.js配置读取', false, error.message);
    }
  }
}

// 检查项目结构
function checkProjectStructure() {
  log.test('检查项目结构...');
  
  const requiredDirs = [
    { path: 'src', desc: '源代码目录' },
    { path: 'src/pages', desc: '页面目录' },
    { path: 'src/components', desc: '组件目录' },
    { path: 'src/lib', desc: '工具库目录' },
    { path: 'public', desc: '静态资源目录' },
    { path: 'scripts', desc: '脚本目录' }
  ];
  
  requiredDirs.forEach(dir => {
    checkFile(dir.path, dir.desc);
  });
  
  const requiredFiles = [
    { path: 'package.json', desc: 'Package配置文件' },
    { path: '.gitignore', desc: 'Git忽略文件' },
    { path: '.env.example', desc: '环境变量示例' },
    { path: 'README.md', desc: '项目说明文件' }
  ];
  
  requiredFiles.forEach(file => {
    checkFile(file.path, file.desc);
  });
}

// 检查依赖
function checkDependencies() {
  log.test('检查依赖配置...');
  
  if (checkJsonFile('package.json', 'Package.json格式')) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // 检查关键依赖
      const requiredDeps = ['next', 'react', 'react-dom', 'ethers'];
      requiredDeps.forEach(dep => {
        const hasDepency = packageJson.dependencies && packageJson.dependencies[dep];
        addTest(`依赖 ${dep}`, !!hasDepency);
      });
      
      // 检查关键脚本
      const requiredScripts = ['build', 'dev', 'start', 'lint'];
      requiredScripts.forEach(script => {
        const hasScript = packageJson.scripts && packageJson.scripts[script];
        addTest(`脚本 ${script}`, !!hasScript);
      });
      
    } catch (error) {
      addTest('Package.json解析', false, error.message);
    }
  }
}

// 检查环境配置
function checkEnvironment() {
  log.test('检查环境配置...');
  
  if (fs.existsSync('.env.example')) {
    try {
      const envContent = fs.readFileSync('.env.example', 'utf8');
      
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID',
        'NEXT_PUBLIC_SM_TOKEN_ADDRESS',
        'NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS'
      ];
      
      requiredVars.forEach(varName => {
        const hasVar = envContent.includes(varName);
        addTest(`环境变量 ${varName}`, hasVar);
      });
      
    } catch (error) {
      addTest('环境变量文件读取', false, error.message);
    }
  }
}

// 检查构建输出
function checkBuild() {
  log.test('检查构建状态...');
  
  const hasOut = checkFile('out', '构建输出目录');
  const hasNext = checkFile('.next', 'Next.js缓存目录');
  
  if (hasOut) {
    try {
      const outFiles = fs.readdirSync('out');
      addTest('构建文件数量', outFiles.length > 0, `${outFiles.length}个文件`);
      
      const hasIndex = outFiles.includes('index.html');
      addTest('首页文件', hasIndex);
      
    } catch (error) {
      addTest('构建目录读取', false, error.message);
    }
  }
}

// 检查安全配置
function checkSecurity() {
  log.test('检查安全配置...');
  
  // 检查.gitignore
  if (fs.existsSync('.gitignore')) {
    try {
      const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
      
      const sensitiveFiles = ['.env', '.env.local', 'node_modules'];
      sensitiveFiles.forEach(file => {
        const isIgnored = gitignoreContent.includes(file);
        addTest(`忽略敏感文件 ${file}`, isIgnored);
      });
      
    } catch (error) {
      addTest('.gitignore读取', false, error.message);
    }
  }
  
  // 检查是否有敏感信息泄露
  const checkFiles = ['package.json', '.env.example'];
  checkFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const hasSensitiveInfo = /private.*key.*0x[a-fA-F0-9]{64}|secret.*[a-zA-Z0-9]{32,}/i.test(content);
        addTest(`${file}无敏感信息`, !hasSensitiveInfo);
      } catch (error) {
        addTest(`${file}安全检查`, false, error.message);
      }
    }
  });
}

// 生成报告
function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 项目检查报告');
  console.log('='.repeat(70));
  
  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
  
  console.log(`\n📈 检查统计:`);
  console.log(`   总检查项: ${results.total}`);
  console.log(`   ✅ 通过: ${results.passed}`);
  console.log(`   ❌ 失败: ${results.failed}`);
  console.log(`   📊 通过率: ${passRate}%`);
  
  // 失败的检查
  const failedTests = results.tests.filter(test => !test.passed);
  if (failedTests.length > 0) {
    console.log(`\n❌ 失败的检查项:`);
    failedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.name}: ${test.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  
  // 部署建议
  if (results.failed === 0) {
    log.success('🎉 所有检查通过！项目已准备好部署。');
  } else if (results.failed <= 5) {
    log.warning('⚠️  存在少量问题，建议修复后部署。');
  } else {
    log.error('❌ 存在较多问题，需要修复后再部署。');
  }
  
  return results.failed <= 5; // 允许少量非关键问题
}

// 主函数
function main() {
  console.log('🚀 开始项目直接检查...\n');
  
  checkProjectStructure();
  checkDependencies();
  checkTypeScript();
  checkNextJs();
  checkEnvironment();
  checkBuild();
  checkSecurity();
  
  const canDeploy = generateReport();
  
  console.log('\n💡 下一步建议:');
  if (canDeploy) {
    console.log('   1. 运行 npm run build 确保构建成功');
    console.log('   2. 配置生产环境变量');
    console.log('   3. 部署到Cloudflare Pages');
  } else {
    console.log('   1. 修复失败的检查项');
    console.log('   2. 重新运行检查');
    console.log('   3. 确认所有问题解决后再部署');
  }
  
  process.exit(canDeploy ? 0 : 1);
}

// 运行检查
main();
