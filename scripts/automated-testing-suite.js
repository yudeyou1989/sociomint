#!/usr/bin/env node

/**
 * 自动化测试套件
 * 运行性能测试、兼容性测试和功能测试
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔄 ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bold}${colors.magenta}${msg}${colors.reset}`)
};

// 测试套件配置
const TEST_SUITE_CONFIG = {
  serverPort: 3000,
  serverStartTimeout: 30000,
  testTimeout: 300000, // 5分钟
  tests: [
    {
      name: '单元测试',
      command: 'npm run test:unit',
      required: true,
      timeout: 60000
    },
    {
      name: '组件测试',
      command: 'npm run test:components',
      required: true,
      timeout: 60000
    },
    {
      name: '性能测试',
      script: 'scripts/performance-test.js',
      required: true,
      timeout: 120000
    },
    {
      name: '兼容性测试',
      script: 'scripts/compatibility-test.js',
      required: false,
      timeout: 180000
    },
    {
      name: 'E2E测试',
      command: 'npm run test:e2e',
      required: false,
      timeout: 120000
    }
  ]
};

// 测试结果
const testResults = {
  startTime: Date.now(),
  endTime: null,
  server: {
    started: false,
    pid: null
  },
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// 启动开发服务器
async function startDevServer() {
  log.step('启动开发服务器...');
  
  return new Promise((resolve, reject) => {
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      detached: false
    });
    
    let serverReady = false;
    const timeout = setTimeout(() => {
      if (!serverReady) {
        server.kill();
        reject(new Error('服务器启动超时'));
      }
    }, TEST_SUITE_CONFIG.serverStartTimeout);
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
        if (!serverReady) {
          serverReady = true;
          clearTimeout(timeout);
          testResults.server.started = true;
          testResults.server.pid = server.pid;
          log.success('开发服务器已启动');
          resolve(server);
        }
      }
    });
    
    server.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Error') || output.includes('EADDRINUSE')) {
        clearTimeout(timeout);
        reject(new Error(`服务器启动失败: ${output}`));
      }
    });
    
    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// 检查服务器是否运行
async function checkServerRunning() {
  const http = require('http');
  
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${TEST_SUITE_CONFIG.serverPort}`, (res) => {
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

// 运行命令测试
async function runCommandTest(test) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      const result = execSync(test.command, {
        stdio: 'pipe',
        timeout: test.timeout,
        encoding: 'utf8'
      });
      
      const endTime = Date.now();
      resolve({
        name: test.name,
        passed: true,
        duration: endTime - startTime,
        output: result,
        error: null
      });
    } catch (error) {
      const endTime = Date.now();
      resolve({
        name: test.name,
        passed: false,
        duration: endTime - startTime,
        output: error.stdout || '',
        error: error.stderr || error.message
      });
    }
  });
}

// 运行脚本测试
async function runScriptTest(test) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const child = spawn('node', [test.script], {
      stdio: 'pipe',
      timeout: test.timeout
    });
    
    let output = '';
    let error = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    child.on('close', (code) => {
      const endTime = Date.now();
      resolve({
        name: test.name,
        passed: code === 0,
        duration: endTime - startTime,
        output,
        error: code !== 0 ? error : null
      });
    });
    
    child.on('error', (err) => {
      const endTime = Date.now();
      resolve({
        name: test.name,
        passed: false,
        duration: endTime - startTime,
        output,
        error: err.message
      });
    });
  });
}

// 运行单个测试
async function runSingleTest(test) {
  log.step(`运行 ${test.name}...`);
  
  let result;
  if (test.command) {
    result = await runCommandTest(test);
  } else if (test.script) {
    result = await runScriptTest(test);
  } else {
    result = {
      name: test.name,
      passed: false,
      duration: 0,
      output: '',
      error: '测试配置错误'
    };
  }
  
  result.required = test.required;
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (result.passed) {
    log.success(`${test.name} 通过 (${(result.duration / 1000).toFixed(1)}s)`);
    testResults.summary.passed++;
  } else {
    if (test.required) {
      log.error(`${test.name} 失败 (必需)`);
      testResults.summary.failed++;
    } else {
      log.warning(`${test.name} 失败 (可选)`);
      testResults.summary.skipped++;
    }
  }
  
  return result;
}

// 运行所有测试
async function runAllTests() {
  log.title('\n🧪 开始运行测试套件');
  log.title('='.repeat(60));
  
  for (const test of TEST_SUITE_CONFIG.tests) {
    await runSingleTest(test);
    console.log(); // 空行分隔
  }
}

// 生成测试报告
function generateTestReport() {
  testResults.endTime = Date.now();
  const totalDuration = testResults.endTime - testResults.startTime;
  
  console.log('\n' + '='.repeat(70));
  log.title('📊 自动化测试报告');
  console.log('='.repeat(70));
  
  const { total, passed, failed, skipped } = testResults.summary;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  
  console.log(`\n📈 测试统计:`);
  console.log(`   总测试数: ${total}`);
  console.log(`   ✅ 通过: ${passed}`);
  console.log(`   ❌ 失败: ${failed}`);
  console.log(`   ⏭️  跳过: ${skipped}`);
  console.log(`   📊 通过率: ${passRate}%`);
  console.log(`   ⏱️  总耗时: ${(totalDuration / 1000).toFixed(1)}s`);
  
  // 详细结果
  console.log(`\n📋 详细结果:`);
  testResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : (test.required ? '❌' : '⚠️');
    const duration = (test.duration / 1000).toFixed(1);
    console.log(`   ${index + 1}. ${status} ${test.name} (${duration}s)`);
    
    if (!test.passed && test.error) {
      console.log(`      错误: ${test.error.split('\n')[0]}`);
    }
  });
  
  // 失败的必需测试
  const failedRequired = testResults.tests.filter(test => !test.passed && test.required);
  if (failedRequired.length > 0) {
    console.log(`\n❌ 失败的必需测试:`);
    failedRequired.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.name}`);
      if (test.error) {
        console.log(`      ${test.error}`);
      }
    });
  }
  
  // 建议
  console.log(`\n💡 建议:`);
  if (failedRequired.length > 0) {
    console.log(`   • 修复所有失败的必需测试后再部署`);
  }
  
  const failedOptional = testResults.tests.filter(test => !test.passed && !test.required);
  if (failedOptional.length > 0) {
    console.log(`   • 考虑修复可选测试以提高质量`);
  }
  
  if (passRate >= 90) {
    console.log(`   • 测试通过率良好，可以考虑部署`);
  } else if (passRate >= 70) {
    console.log(`   • 测试通过率一般，建议优化后部署`);
  } else {
    console.log(`   • 测试通过率较低，不建议部署`);
  }
  
  console.log('\n' + '='.repeat(70));
  
  // 判断是否可以部署
  const canDeploy = failedRequired.length === 0;
  
  if (canDeploy) {
    log.success('🚀 所有必需测试通过，项目可以部署！');
  } else {
    log.error('❌ 存在失败的必需测试，请修复后再部署！');
  }
  
  return canDeploy;
}

// 保存测试结果
function saveTestResults() {
  const reportPath = path.join(process.cwd(), 'test-results', 'automated-test-report.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log.info(`测试结果已保存到: ${reportPath}`);
  
  // 生成HTML报告
  generateHTMLReport(reportPath.replace('.json', '.html'));
}

// 生成HTML报告
function generateHTMLReport(htmlPath) {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SocioMint 自动化测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #666; }
        .test-list { margin-top: 20px; }
        .test-item { display: flex; align-items: center; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #ddd; }
        .test-item.passed { background: #d4edda; border-left-color: #28a745; }
        .test-item.failed { background: #f8d7da; border-left-color: #dc3545; }
        .test-item.skipped { background: #fff3cd; border-left-color: #ffc107; }
        .test-status { font-size: 1.2em; margin-right: 10px; }
        .test-details { flex: 1; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-duration { color: #666; font-size: 0.9em; }
        .error-details { margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 SocioMint 自动化测试报告</h1>
            <p>生成时间: ${new Date(testResults.endTime).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-value">${testResults.summary.total}</div>
                <div class="stat-label">总测试数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #28a745">${testResults.summary.passed}</div>
                <div class="stat-label">通过</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #dc3545">${testResults.summary.failed}</div>
                <div class="stat-label">失败</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #ffc107">${testResults.summary.skipped}</div>
                <div class="stat-label">跳过</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%</div>
                <div class="stat-label">通过率</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${((testResults.endTime - testResults.startTime) / 1000).toFixed(1)}s</div>
                <div class="stat-label">总耗时</div>
            </div>
        </div>
        
        <div class="test-list">
            <h2>📋 测试详情</h2>
            ${testResults.tests.map((test, index) => `
                <div class="test-item ${test.passed ? 'passed' : (test.required ? 'failed' : 'skipped')}">
                    <div class="test-status">${test.passed ? '✅' : (test.required ? '❌' : '⚠️')}</div>
                    <div class="test-details">
                        <div class="test-name">${test.name}</div>
                        <div class="test-duration">耗时: ${(test.duration / 1000).toFixed(1)}s ${test.required ? '(必需)' : '(可选)'}</div>
                        ${test.error ? `<div class="error-details">${test.error}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(htmlPath, html);
  log.info(`HTML报告已生成: ${htmlPath}`);
}

// 清理资源
function cleanup() {
  if (testResults.server.pid) {
    try {
      process.kill(testResults.server.pid);
      log.info('开发服务器已停止');
    } catch (error) {
      // 忽略清理错误
    }
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 启动自动化测试套件...\n');
    
    // 检查是否已有服务器运行
    const serverRunning = await checkServerRunning();
    let server = null;
    
    if (!serverRunning) {
      server = await startDevServer();
      // 等待服务器完全启动
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      log.info('检测到服务器已运行，跳过启动步骤');
    }
    
    // 运行所有测试
    await runAllTests();
    
    // 生成报告
    const canDeploy = generateTestReport();
    saveTestResults();
    
    // 清理资源
    if (server && !serverRunning) {
      cleanup();
    }
    
    process.exit(canDeploy ? 0 : 1);
    
  } catch (error) {
    log.error(`测试套件执行失败: ${error.message}`);
    cleanup();
    process.exit(1);
  }
}

// 处理进程退出
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// 启动测试
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  generateTestReport,
  startDevServer
};
