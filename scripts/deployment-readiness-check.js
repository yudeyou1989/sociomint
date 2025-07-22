#!/usr/bin/env node

/**
 * 部署准备检查脚本
 * 综合运行所有检查，确保项目准备好部署
 */

const { execSync } = require('child_process');
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

// 检查结果
const checkResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// 运行命令并捕获结果
function runCheck(name, command, description) {
  log.step(`${name}: ${description}`);
  
  try {
    const result = execSync(command, { 
      stdio: 'pipe',
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    
    log.success(`${name} 通过`);
    checkResults.passed++;
    checkResults.details.push({
      name,
      status: 'passed',
      message: description
    });
    
    return true;
  } catch (error) {
    const isWarning = error.status === 1 && command.includes('warning');
    
    if (isWarning) {
      log.warning(`${name} 有警告`);
      checkResults.warnings++;
      checkResults.details.push({
        name,
        status: 'warning',
        message: description,
        error: error.stdout || error.stderr
      });
      return true;
    } else {
      log.error(`${name} 失败`);
      checkResults.failed++;
      checkResults.details.push({
        name,
        status: 'failed',
        message: description,
        error: error.stdout || error.stderr
      });
      return false;
    }
  }
}

// 运行Node.js脚本检查
function runScriptCheck(name, scriptPath, description) {
  log.step(`${name}: ${description}`);
  
  try {
    const result = execSync(`node "${scriptPath}"`, { 
      stdio: 'pipe',
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    
    log.success(`${name} 通过`);
    checkResults.passed++;
    checkResults.details.push({
      name,
      status: 'passed',
      message: description
    });
    
    return true;
  } catch (error) {
    log.error(`${name} 失败`);
    checkResults.failed++;
    checkResults.details.push({
      name,
      status: 'failed',
      message: description,
      error: error.stdout || error.stderr
    });
    return false;
  }
}

// 主检查流程
async function runDeploymentChecks() {
  log.title('\n🚀 SocioMint 部署准备检查');
  log.title('='.repeat(60));
  
  console.log('\n📋 检查清单:');
  console.log('   1. 代码质量检查');
  console.log('   2. 类型检查');
  console.log('   3. 测试运行');
  console.log('   4. 构建测试');
  console.log('   5. 安全扫描');
  console.log('   6. 性能测试');
  console.log('   7. 配置验证');
  console.log('   8. 最终检查');
  
  console.log('\n🔍 开始检查...\n');
  
  // 1. 代码质量检查
  log.title('1️⃣  代码质量检查');
  runCheck('ESLint', 'npm run lint', '检查代码规范和潜在问题');
  runCheck('Prettier', 'npm run format:check', '检查代码格式');
  
  // 2. 类型检查
  log.title('\n2️⃣  TypeScript类型检查');
  runCheck('TypeScript', 'npm run type-check', '检查类型错误');
  
  // 3. 测试运行
  log.title('\n3️⃣  测试运行');
  runCheck('单元测试', 'npm run test:unit', '运行单元测试');
  runCheck('组件测试', 'npm run test:components', '运行组件测试');
  
  // 4. 构建测试
  log.title('\n4️⃣  构建测试');
  runCheck('项目构建', 'npm run build', '测试项目构建');
  
  // 5. 安全扫描
  log.title('\n5️⃣  安全扫描');
  runScriptCheck('安全检查', 'scripts/final-security-check.js', '扫描安全漏洞');
  
  // 6. 性能测试
  log.title('\n6️⃣  性能测试');
  runScriptCheck('性能基准', 'scripts/performance-benchmark.js', '测试性能指标');
  
  // 7. 配置验证
  log.title('\n7️⃣  配置验证');
  runScriptCheck('生产配置', 'scripts/production-config-validator.js', '验证生产环境配置');
  
  // 8. 最终检查
  log.title('\n8️⃣  最终检查');
  runCheck('依赖审计', 'npm audit --audit-level=high', '检查依赖安全性');
  
  // 生成最终报告
  generateFinalReport();
}

// 生成最终报告
function generateFinalReport() {
  console.log('\n' + '='.repeat(70));
  log.title('📊 部署准备报告');
  console.log('='.repeat(70));
  
  // 统计信息
  const total = checkResults.passed + checkResults.failed + checkResults.warnings;
  console.log(`\n📈 检查统计:`);
  console.log(`   总检查项: ${total}`);
  console.log(`   ✅ 通过: ${checkResults.passed}`);
  console.log(`   ❌ 失败: ${checkResults.failed}`);
  console.log(`   ⚠️  警告: ${checkResults.warnings}`);
  
  // 成功率
  const successRate = total > 0 ? ((checkResults.passed / total) * 100).toFixed(1) : 0;
  console.log(`   📊 成功率: ${successRate}%`);
  
  // 详细结果
  if (checkResults.failed > 0) {
    console.log(`\n❌ 失败的检查项:`);
    checkResults.details
      .filter(detail => detail.status === 'failed')
      .forEach((detail, index) => {
        console.log(`   ${index + 1}. ${detail.name}: ${detail.message}`);
        if (detail.error) {
          console.log(`      错误: ${detail.error.split('\n')[0]}`);
        }
      });
  }
  
  if (checkResults.warnings > 0) {
    console.log(`\n⚠️  警告项:`);
    checkResults.details
      .filter(detail => detail.status === 'warning')
      .forEach((detail, index) => {
        console.log(`   ${index + 1}. ${detail.name}: ${detail.message}`);
      });
  }
  
  // 部署建议
  console.log(`\n💡 部署建议:`);
  
  if (checkResults.failed === 0) {
    if (checkResults.warnings === 0) {
      log.success('🎉 所有检查都通过了！项目已准备好部署到生产环境。');
      console.log('\n🚀 部署步骤:');
      console.log('   1. 确认所有环境变量已正确配置');
      console.log('   2. 运行 npm run build 生成生产构建');
      console.log('   3. 将 out/ 目录上传到 Cloudflare Pages');
      console.log('   4. 配置自定义域名 sociomint.top');
      console.log('   5. 验证部署后的功能');
    } else {
      log.warning('⚠️  所有关键检查都通过了，但存在一些警告。建议修复警告后部署。');
      console.log('\n✅ 可以部署，但建议:');
      console.log('   • 修复所有警告项');
      console.log('   • 在测试环境验证功能');
      console.log('   • 监控部署后的性能');
    }
  } else {
    log.error('❌ 存在失败的检查项，不建议部署到生产环境。');
    console.log('\n🔧 修复建议:');
    console.log('   • 修复所有失败的检查项');
    console.log('   • 重新运行检查确认修复');
    console.log('   • 在本地环境充分测试');
  }
  
  // 部署清单
  console.log(`\n📋 部署前最终清单:`);
  console.log('   □ 所有代码已提交到Git');
  console.log('   □ 环境变量已在Cloudflare Pages配置');
  console.log('   □ 域名DNS已正确配置');
  console.log('   □ SSL证书已配置');
  console.log('   □ 监控和日志已设置');
  console.log('   □ 备份和回滚计划已准备');
  
  console.log('\n' + '='.repeat(70));
  
  // 返回部署就绪状态
  return checkResults.failed === 0;
}

// 显示帮助信息
function showHelp() {
  console.log(`
🚀 SocioMint 部署准备检查工具

用法:
  node scripts/deployment-readiness-check.js [选项]

选项:
  --help, -h     显示帮助信息
  --quick, -q    快速检查（跳过耗时的测试）
  --verbose, -v  详细输出

示例:
  node scripts/deployment-readiness-check.js
  node scripts/deployment-readiness-check.js --quick
  node scripts/deployment-readiness-check.js --verbose

检查项目:
  • 代码质量 (ESLint, Prettier)
  • 类型检查 (TypeScript)
  • 测试运行 (Jest, Playwright)
  • 构建测试 (Next.js build)
  • 安全扫描 (安全漏洞检测)
  • 性能测试 (Bundle分析)
  • 配置验证 (环境变量等)
  • 依赖审计 (npm audit)
`);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  try {
    const isReady = await runDeploymentChecks();
    process.exit(isReady ? 0 : 1);
  } catch (error) {
    log.error(`检查过程中发生错误: ${error.message}`);
    process.exit(1);
  }
}

// 运行检查
if (require.main === module) {
  main();
}

module.exports = {
  runDeploymentChecks,
  generateFinalReport,
  runCheck,
  runScriptCheck
};
