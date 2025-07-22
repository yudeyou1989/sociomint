/**
 * 简化的性能测试脚本
 * 不依赖Lighthouse，使用基础的性能检测
 */

const { chromium } = require('playwright');
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
  metric: (msg) => console.log(`${colors.cyan}📊 ${msg}${colors.reset}`)
};

// 性能基准
const PERFORMANCE_THRESHOLDS = {
  loadTime: 5000,    // 5秒
  domReady: 3000,    // 3秒
  resourceCount: 50, // 最大资源数
  totalSize: 5 * 1024 * 1024, // 5MB
  jsErrors: 0        // JavaScript错误数
};

// 测试配置
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  pages: [
    { path: '/', name: '首页' },
    { path: '/exchange', name: '代币交换页' },
    { path: '/tasks', name: '社交任务页' }
  ],
  devices: [
    { name: 'Desktop', viewport: { width: 1920, height: 1080 } },
    { name: 'Mobile', viewport: { width: 375, height: 667 } }
  ]
};

// 测试结果
const performanceResults = {
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// 运行性能测试
async function runPerformanceTest(page, testInfo) {
  const metrics = {};
  const errors = [];
  
  // 监听JavaScript错误
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  // 监听控制台错误
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  try {
    // 测量页面加载时间
    const startTime = Date.now();
    await page.goto(testInfo.url, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    metrics.loadTime = loadTime;
    
    // 获取性能指标
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        domReady: navigation.domComplete - navigation.navigationStart,
        resourceCount: resources.length,
        totalTransferSize: resources.reduce((total, resource) => total + (resource.transferSize || 0), 0)
      };
    });
    
    Object.assign(metrics, performanceMetrics);
    metrics.jsErrors = errors.length;
    
    // 检查页面基本功能
    const title = await page.title();
    const hasContent = await page.locator('body').textContent();
    
    metrics.hasTitle = title.length > 0;
    metrics.hasContent = hasContent.length > 100; // 至少100字符内容
    
    return {
      success: true,
      metrics,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      metrics,
      errors
    };
  }
}

// 分析测试结果
function analyzeTestResult(result, testInfo) {
  const issues = [];
  const { metrics } = result;
  
  // 检查加载时间
  if (metrics.loadTime > PERFORMANCE_THRESHOLDS.loadTime) {
    issues.push({
      type: 'performance',
      message: `页面加载时间过长: ${metrics.loadTime}ms (期望: <${PERFORMANCE_THRESHOLDS.loadTime}ms)`,
      severity: 'high'
    });
  }
  
  // 检查DOM就绪时间
  if (metrics.domReady > PERFORMANCE_THRESHOLDS.domReady) {
    issues.push({
      type: 'performance',
      message: `DOM就绪时间过长: ${metrics.domReady}ms (期望: <${PERFORMANCE_THRESHOLDS.domReady}ms)`,
      severity: 'medium'
    });
  }
  
  // 检查资源数量
  if (metrics.resourceCount > PERFORMANCE_THRESHOLDS.resourceCount) {
    issues.push({
      type: 'resources',
      message: `资源数量过多: ${metrics.resourceCount} (期望: <${PERFORMANCE_THRESHOLDS.resourceCount})`,
      severity: 'medium'
    });
  }
  
  // 检查总大小
  if (metrics.totalTransferSize > PERFORMANCE_THRESHOLDS.totalSize) {
    issues.push({
      type: 'size',
      message: `传输大小过大: ${(metrics.totalTransferSize / 1024 / 1024).toFixed(2)}MB (期望: <${PERFORMANCE_THRESHOLDS.totalSize / 1024 / 1024}MB)`,
      severity: 'high'
    });
  }
  
  // 检查JavaScript错误
  if (metrics.jsErrors > PERFORMANCE_THRESHOLDS.jsErrors) {
    issues.push({
      type: 'errors',
      message: `JavaScript错误: ${metrics.jsErrors}个`,
      severity: 'high'
    });
  }
  
  // 检查基本功能
  if (!metrics.hasTitle) {
    issues.push({
      type: 'content',
      message: '页面缺少标题',
      severity: 'medium'
    });
  }
  
  if (!metrics.hasContent) {
    issues.push({
      type: 'content',
      message: '页面内容不足',
      severity: 'high'
    });
  }
  
  const highIssues = issues.filter(issue => issue.severity === 'high').length;
  const passed = result.success && highIssues === 0;
  
  return {
    ...testInfo,
    timestamp: new Date().toISOString(),
    passed,
    metrics,
    issues,
    errors: result.errors || []
  };
}

// 运行所有测试
async function runAllPerformanceTests() {
  log.info('开始性能测试...\n');
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    for (const pageInfo of TEST_CONFIG.pages) {
      for (const device of TEST_CONFIG.devices) {
        const testInfo = {
          page: pageInfo.name,
          device: device.name,
          url: TEST_CONFIG.baseUrl + pageInfo.path,
          viewport: device.viewport
        };
        
        log.info(`测试: ${testInfo.page} - ${testInfo.device}`);
        
        const context = await browser.newContext({
          viewport: device.viewport
        });
        
        const page = await context.newPage();
        
        try {
          const result = await runPerformanceTest(page, testInfo);
          const analysis = analyzeTestResult(result, testInfo);
          
          performanceResults.tests.push(analysis);
          performanceResults.summary.total++;
          
          if (analysis.passed) {
            log.success(`通过 - 加载时间: ${analysis.metrics.loadTime}ms`);
            performanceResults.summary.passed++;
          } else {
            log.error(`失败 - ${analysis.issues.length}个问题`);
            performanceResults.summary.failed++;
            
            // 显示主要问题
            analysis.issues.slice(0, 2).forEach(issue => {
              log.warning(`  • ${issue.message}`);
            });
          }
          
        } catch (error) {
          log.error(`测试执行失败: ${error.message}`);
          performanceResults.summary.failed++;
        } finally {
          await context.close();
        }
        
        console.log(); // 空行分隔
      }
    }
  } finally {
    await browser.close();
  }
}

// 生成性能报告
function generatePerformanceReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 性能测试报告');
  console.log('='.repeat(70));
  
  const { total, passed, failed } = performanceResults.summary;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  
  console.log(`\n📈 测试统计:`);
  console.log(`   总测试数: ${total}`);
  console.log(`   ✅ 通过: ${passed}`);
  console.log(`   ❌ 失败: ${failed}`);
  console.log(`   📊 通过率: ${passRate}%`);
  
  // 性能指标汇总
  if (performanceResults.tests.length > 0) {
    const avgLoadTime = performanceResults.tests.reduce((sum, test) => sum + test.metrics.loadTime, 0) / performanceResults.tests.length;
    const avgResourceCount = performanceResults.tests.reduce((sum, test) => sum + test.metrics.resourceCount, 0) / performanceResults.tests.length;
    
    console.log(`\n📊 平均性能指标:`);
    console.log(`   平均加载时间: ${Math.round(avgLoadTime)}ms`);
    console.log(`   平均资源数量: ${Math.round(avgResourceCount)}`);
  }
  
  // 详细结果
  console.log(`\n📋 详细结果:`);
  performanceResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`\n${index + 1}. ${status} ${test.page} (${test.device})`);
    console.log(`   加载时间: ${test.metrics.loadTime}ms`);
    console.log(`   资源数量: ${test.metrics.resourceCount}`);
    console.log(`   传输大小: ${(test.metrics.totalTransferSize / 1024).toFixed(1)}KB`);
    
    if (test.issues.length > 0) {
      console.log(`   ⚠️  问题:`);
      test.issues.forEach(issue => {
        console.log(`      • ${issue.message}`);
      });
    }
    
    if (test.errors.length > 0) {
      console.log(`   🐛 错误:`);
      test.errors.slice(0, 3).forEach(error => {
        console.log(`      • ${error}`);
      });
    }
  });
  
  // 优化建议
  console.log(`\n💡 优化建议:`);
  const allIssues = performanceResults.tests.flatMap(test => test.issues);
  const issueTypes = {};
  
  allIssues.forEach(issue => {
    issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
  });
  
  if (issueTypes.performance) {
    console.log(`   • 优化页面加载性能 - 压缩资源、启用缓存`);
  }
  
  if (issueTypes.resources) {
    console.log(`   • 减少资源数量 - 合并文件、移除未使用的资源`);
  }
  
  if (issueTypes.size) {
    console.log(`   • 减少传输大小 - 启用gzip压缩、优化图片`);
  }
  
  if (issueTypes.errors) {
    console.log(`   • 修复JavaScript错误 - 检查控制台错误`);
  }
  
  console.log('\n' + '='.repeat(70));
  
  return failed === 0;
}

// 保存测试结果
function saveTestResults() {
  const reportPath = path.join(process.cwd(), 'test-results', 'simple-performance-report.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(performanceResults, null, 2));
  log.info(`测试结果已保存到: ${reportPath}`);
}

// 检查本地服务器
async function checkLocalServer() {
  const http = require('http');
  
  return new Promise((resolve) => {
    const req = http.get(TEST_CONFIG.baseUrl, (res) => {
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

// 主函数
async function main() {
  try {
    console.log('⚡ 开始简化性能测试...\n');
    
    const serverRunning = await checkLocalServer();
    if (!serverRunning) {
      log.error('本地服务器未运行，请先启动: npm run dev');
      process.exit(1);
    }
    
    await runAllPerformanceTests();
    const allPassed = generatePerformanceReport();
    saveTestResults();
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    log.error(`性能测试失败: ${error.message}`);
    process.exit(1);
  }
}

// 启动测试
if (require.main === module) {
  main();
}

module.exports = {
  runAllPerformanceTests,
  generatePerformanceReport
};
