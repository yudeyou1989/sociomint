/**
 * 快速测试脚本 - 不依赖npm scripts
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

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
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// 检查服务器是否运行
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// 检查文件是否存在
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  testResults.total++;
  
  if (exists) {
    log.success(`${description}: 存在`);
    testResults.passed++;
    testResults.tests.push({ name: description, status: 'passed' });
  } else {
    log.error(`${description}: 不存在`);
    testResults.failed++;
    testResults.tests.push({ name: description, status: 'failed' });
  }
  
  return exists;
}

// 检查package.json配置
function checkPackageJson() {
  log.test('检查package.json配置...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // 检查必需的脚本
    const requiredScripts = ['build', 'dev', 'start'];
    requiredScripts.forEach(script => {
      testResults.total++;
      if (packageJson.scripts && packageJson.scripts[script]) {
        log.success(`脚本 ${script}: 已配置`);
        testResults.passed++;
        testResults.tests.push({ name: `脚本 ${script}`, status: 'passed' });
      } else {
        log.error(`脚本 ${script}: 缺失`);
        testResults.failed++;
        testResults.tests.push({ name: `脚本 ${script}`, status: 'failed' });
      }
    });
    
    // 检查关键依赖
    const requiredDeps = ['next', 'react', 'react-dom'];
    requiredDeps.forEach(dep => {
      testResults.total++;
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        log.success(`依赖 ${dep}: 已安装`);
        testResults.passed++;
        testResults.tests.push({ name: `依赖 ${dep}`, status: 'passed' });
      } else {
        log.error(`依赖 ${dep}: 缺失`);
        testResults.failed++;
        testResults.tests.push({ name: `依赖 ${dep}`, status: 'failed' });
      }
    });
    
  } catch (error) {
    log.error(`package.json解析失败: ${error.message}`);
    testResults.total++;
    testResults.failed++;
    testResults.tests.push({ name: 'package.json解析', status: 'failed' });
  }
}

// 检查项目结构
function checkProjectStructure() {
  log.test('检查项目结构...');
  
  const requiredFiles = [
    { path: 'next.config.ts', desc: 'Next.js配置文件' },
    { path: 'tsconfig.json', desc: 'TypeScript配置文件' },
    { path: 'src', desc: '源代码目录' },
    { path: 'src/pages', desc: '页面目录' },
    { path: 'src/components', desc: '组件目录' },
    { path: 'public', desc: '静态资源目录' }
  ];
  
  requiredFiles.forEach(file => {
    checkFile(file.path, file.desc);
  });
}

// 检查环境配置
function checkEnvironmentConfig() {
  log.test('检查环境配置...');
  
  const envFiles = [
    { path: '.env.example', desc: '环境变量示例文件' },
    { path: '.gitignore', desc: 'Git忽略文件' }
  ];
  
  envFiles.forEach(file => {
    checkFile(file.path, file.desc);
  });
  
  // 检查.env.example内容
  if (fs.existsSync('.env.example')) {
    try {
      const envContent = fs.readFileSync('.env.example', 'utf8');
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID'
      ];
      
      requiredVars.forEach(varName => {
        testResults.total++;
        if (envContent.includes(varName)) {
          log.success(`环境变量 ${varName}: 已定义`);
          testResults.passed++;
          testResults.tests.push({ name: `环境变量 ${varName}`, status: 'passed' });
        } else {
          log.error(`环境变量 ${varName}: 缺失`);
          testResults.failed++;
          testResults.tests.push({ name: `环境变量 ${varName}`, status: 'failed' });
        }
      });
    } catch (error) {
      log.error(`读取.env.example失败: ${error.message}`);
    }
  }
}

// 检查构建输出
function checkBuildOutput() {
  log.test('检查构建输出...');
  
  const buildFiles = [
    { path: 'out', desc: '构建输出目录' },
    { path: '.next', desc: 'Next.js缓存目录' }
  ];
  
  buildFiles.forEach(file => {
    checkFile(file.path, file.desc);
  });
}

// 生成测试报告
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 快速测试报告');
  console.log('='.repeat(60));
  
  const passRate = testResults.total > 0 ? ((testResults.passed / testResults.total) * 100).toFixed(1) : 0;
  
  console.log(`\n📈 测试统计:`);
  console.log(`   总测试数: ${testResults.total}`);
  console.log(`   ✅ 通过: ${testResults.passed}`);
  console.log(`   ❌ 失败: ${testResults.failed}`);
  console.log(`   📊 通过率: ${passRate}%`);
  
  // 失败的测试
  const failedTests = testResults.tests.filter(test => test.status === 'failed');
  if (failedTests.length > 0) {
    console.log(`\n❌ 失败的测试:`);
    failedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.name}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (testResults.failed === 0) {
    log.success('🎉 所有测试通过！项目状态良好。');
  } else if (testResults.failed <= 3) {
    log.warning('⚠️  存在少量问题，但项目基本可用。');
  } else {
    log.error('❌ 存在较多问题，需要修复后再部署。');
  }
  
  return testResults.failed === 0;
}

// 主函数
async function main() {
  console.log('🚀 开始快速项目检查...\n');
  
  // 检查服务器状态
  log.test('检查开发服务器状态...');
  const serverRunning = await checkServer();
  testResults.total++;
  
  if (serverRunning) {
    log.success('开发服务器: 运行中');
    testResults.passed++;
    testResults.tests.push({ name: '开发服务器', status: 'passed' });
  } else {
    log.warning('开发服务器: 未运行');
    testResults.failed++;
    testResults.tests.push({ name: '开发服务器', status: 'failed' });
  }
  
  // 运行各项检查
  checkPackageJson();
  checkProjectStructure();
  checkEnvironmentConfig();
  checkBuildOutput();
  
  // 生成报告
  const allPassed = generateReport();
  
  process.exit(allPassed ? 0 : 1);
}

// 运行测试
main().catch(error => {
  log.error(`测试执行失败: ${error.message}`);
  process.exit(1);
});
