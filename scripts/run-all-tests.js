#!/usr/bin/env node

/**
 * 完整测试运行脚本
 * 按顺序运行所有类型的测试
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🚀 ${description}`, 'cyan');
  log(`执行命令: ${command}`, 'blue');
  
  try {
    const startTime = Date.now();
    const output = execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log(`✅ ${description} 完成 (${duration}s)`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} 失败`, 'red');
    log(`错误: ${error.message}`, 'red');
    return false;
  }
}

function generateTestReport(results) {
  const reportPath = path.join(process.cwd(), 'test-results', 'test-summary.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      successRate: `${((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%`
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`📊 测试报告已生成: ${reportPath}`, 'magenta');
  
  return report;
}

async function main() {
  log('🎯 SocioMint 完整测试套件', 'bright');
  log('=' * 50, 'cyan');
  
  const testSuites = [
    {
      name: '单元测试',
      command: 'npm run test:unit -- --watchAll=false',
      description: '运行基础单元测试'
    },
    {
      name: '工具函数测试',
      command: 'npm test -- --testPathPattern="formatters" --watchAll=false',
      description: '运行工具函数测试'
    },
    {
      name: '组件测试',
      command: 'npm run test:components -- --watchAll=false',
      description: '运行组件测试'
    },
    {
      name: '集成测试',
      command: 'npm run test:integration -- --watchAll=false',
      description: '运行集成测试'
    },
    {
      name: '性能测试',
      command: 'npm run test:performance -- --watchAll=false',
      description: '运行性能测试'
    },
    {
      name: '覆盖率测试',
      command: 'npm run test:coverage -- --watchAll=false',
      description: '生成测试覆盖率报告'
    }
  ];
  
  const results = [];
  
  // 运行 Jest 测试
  for (const suite of testSuites) {
    const success = runCommand(suite.command, suite.description);
    results.push({
      name: suite.name,
      success,
      type: 'jest'
    });
  }
  
  // 检查是否有开发服务器运行
  log('\n🔍 检查开发服务器状态...', 'yellow');
  
  try {
    execSync('curl -f http://localhost:3000 > /dev/null 2>&1');
    log('✅ 开发服务器正在运行', 'green');
    
    // 运行 E2E 测试
    const e2eSuccess = runCommand('npm run e2e', '运行端到端测试');
    results.push({
      name: 'E2E测试',
      success: e2eSuccess,
      type: 'playwright'
    });
    
    // 运行视觉回归测试
    const visualSuccess = runCommand('npm run test:visual', '运行视觉回归测试');
    results.push({
      name: '视觉回归测试',
      success: visualSuccess,
      type: 'playwright'
    });
    
  } catch (error) {
    log('⚠️  开发服务器未运行，跳过 E2E 测试', 'yellow');
    log('💡 提示: 运行 "npm run dev" 启动开发服务器后再运行 E2E 测试', 'blue');
    
    results.push({
      name: 'E2E测试',
      success: false,
      type: 'playwright',
      reason: '开发服务器未运行'
    });
    
    results.push({
      name: '视觉回归测试',
      success: false,
      type: 'playwright',
      reason: '开发服务器未运行'
    });
  }
  
  // 生成测试报告
  log('\n📊 生成测试报告...', 'cyan');
  const report = generateTestReport(results);
  
  // 显示测试总结
  log('\n🎯 测试总结', 'bright');
  log('=' * 30, 'cyan');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const reason = result.reason ? ` (${result.reason})` : '';
    log(`${status} ${result.name}${reason}`, result.success ? 'green' : 'red');
  });
  
  log(`\n📈 总体成功率: ${report.summary.successRate}`, 'bright');
  log(`✅ 通过: ${report.summary.passed}`, 'green');
  log(`❌ 失败: ${report.summary.failed}`, 'red');
  log(`📊 总计: ${report.summary.total}`, 'blue');
  
  // 提供下一步建议
  log('\n💡 下一步建议:', 'yellow');
  
  if (report.summary.failed > 0) {
    log('• 查看失败的测试详情并修复问题', 'yellow');
    log('• 运行 "npm test -- --verbose" 获取详细错误信息', 'yellow');
  }
  
  if (!results.find(r => r.name === 'E2E测试' && r.success)) {
    log('• 启动开发服务器: npm run dev', 'yellow');
    log('• 然后运行 E2E 测试: npm run e2e', 'yellow');
  }
  
  log('• 查看覆盖率报告: open coverage/lcov-report/index.html', 'yellow');
  log('• 查看测试报告: cat test-results/test-summary.json', 'yellow');
  
  // 退出码
  const exitCode = report.summary.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  log(`💥 未捕获的异常: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 未处理的 Promise 拒绝: ${reason}`, 'red');
  process.exit(1);
});

// 运行主函数
main().catch(error => {
  log(`💥 脚本执行失败: ${error.message}`, 'red');
  process.exit(1);
});
