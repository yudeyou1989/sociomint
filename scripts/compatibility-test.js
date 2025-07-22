/**
 * 自动化兼容性测试脚本
 * 测试不同浏览器和设备的兼容性
 */

const { chromium, firefox, webkit } = require('playwright');
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

// 测试配置
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  browsers: [
    { name: 'chromium', engine: chromium },
    { name: 'firefox', engine: firefox },
    { name: 'webkit', engine: webkit }
  ],
  devices: [
    { name: 'Desktop Chrome', viewport: { width: 1920, height: 1080 } },
    { name: 'Desktop Firefox', viewport: { width: 1920, height: 1080 } },
    { name: 'iPad Pro', viewport: { width: 1024, height: 1366 } },
    { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
    { name: 'Samsung Galaxy S21', viewport: { width: 384, height: 854 } }
  ],
  pages: [
    { path: '/', name: '首页' },
    { path: '/exchange', name: '代币交换页' },
    { path: '/tasks', name: '社交任务页' }
  ]
};

// 测试结果
const compatibilityResults = {
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// 基础功能测试
async function testBasicFunctionality(page, testInfo) {
  const tests = [];
  
  try {
    // 测试页面加载
    await page.goto(testInfo.url, { waitUntil: 'networkidle' });
    tests.push({
      name: '页面加载',
      passed: true,
      message: '页面成功加载'
    });
  } catch (error) {
    tests.push({
      name: '页面加载',
      passed: false,
      message: `页面加载失败: ${error.message}`
    });
  }

  try {
    // 检查关键元素
    const title = await page.title();
    tests.push({
      name: '页面标题',
      passed: title.length > 0,
      message: title.length > 0 ? `标题: ${title}` : '页面标题为空'
    });
  } catch (error) {
    tests.push({
      name: '页面标题',
      passed: false,
      message: `获取标题失败: ${error.message}`
    });
  }

  try {
    // 检查JavaScript错误
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.waitForTimeout(2000); // 等待JS执行
    
    tests.push({
      name: 'JavaScript错误',
      passed: errors.length === 0,
      message: errors.length === 0 ? '无JavaScript错误' : `发现${errors.length}个错误: ${errors.join(', ')}`
    });
  } catch (error) {
    tests.push({
      name: 'JavaScript错误',
      passed: false,
      message: `错误检查失败: ${error.message}`
    });
  }

  try {
    // 检查控制台警告
    const warnings = [];
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    tests.push({
      name: '控制台警告',
      passed: warnings.length === 0,
      message: warnings.length === 0 ? '无控制台警告' : `发现${warnings.length}个警告`
    });
  } catch (error) {
    tests.push({
      name: '控制台警告',
      passed: false,
      message: `警告检查失败: ${error.message}`
    });
  }

  return tests;
}

// 响应式设计测试
async function testResponsiveDesign(page, testInfo) {
  const tests = [];
  
  try {
    // 设置视口大小
    await page.setViewportSize(testInfo.viewport);
    await page.goto(testInfo.url, { waitUntil: 'networkidle' });
    
    // 检查元素是否可见
    const elements = [
      { selector: 'header', name: '页头' },
      { selector: 'main', name: '主内容区' },
      { selector: 'button', name: '按钮' }
    ];
    
    for (const element of elements) {
      try {
        const isVisible = await page.isVisible(element.selector);
        tests.push({
          name: `${element.name}可见性`,
          passed: isVisible,
          message: isVisible ? `${element.name}正常显示` : `${element.name}不可见`
        });
      } catch (error) {
        tests.push({
          name: `${element.name}可见性`,
          passed: false,
          message: `检查失败: ${error.message}`
        });
      }
    }
    
    // 检查滚动
    try {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      const scrollY = await page.evaluate(() => window.scrollY);
      tests.push({
        name: '页面滚动',
        passed: scrollY > 0,
        message: scrollY > 0 ? '滚动功能正常' : '滚动功能异常'
      });
    } catch (error) {
      tests.push({
        name: '页面滚动',
        passed: false,
        message: `滚动测试失败: ${error.message}`
      });
    }
    
  } catch (error) {
    tests.push({
      name: '响应式设计',
      passed: false,
      message: `响应式测试失败: ${error.message}`
    });
  }
  
  return tests;
}

// 交互功能测试
async function testInteractivity(page, testInfo) {
  const tests = [];
  
  try {
    await page.goto(testInfo.url, { waitUntil: 'networkidle' });
    
    // 测试按钮点击
    const buttons = await page.$$('button');
    if (buttons.length > 0) {
      try {
        await buttons[0].click();
        await page.waitForTimeout(1000);
        
        tests.push({
          name: '按钮交互',
          passed: true,
          message: '按钮点击功能正常'
        });
      } catch (error) {
        tests.push({
          name: '按钮交互',
          passed: false,
          message: `按钮点击失败: ${error.message}`
        });
      }
    }
    
    // 测试表单输入（如果有）
    const inputs = await page.$$('input');
    if (inputs.length > 0) {
      try {
        await inputs[0].fill('test');
        const value = await inputs[0].inputValue();
        
        tests.push({
          name: '表单输入',
          passed: value === 'test',
          message: value === 'test' ? '表单输入功能正常' : '表单输入功能异常'
        });
      } catch (error) {
        tests.push({
          name: '表单输入',
          passed: false,
          message: `表单输入测试失败: ${error.message}`
        });
      }
    }
    
  } catch (error) {
    tests.push({
      name: '交互功能',
      passed: false,
      message: `交互测试失败: ${error.message}`
    });
  }
  
  return tests;
}

// 性能指标测试
async function testPerformanceMetrics(page, testInfo) {
  const tests = [];
  
  try {
    const startTime = Date.now();
    await page.goto(testInfo.url, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    tests.push({
      name: '页面加载时间',
      passed: loadTime < 5000,
      message: `加载时间: ${loadTime}ms ${loadTime < 5000 ? '(良好)' : '(需优化)'}`
    });
    
    // 检查资源加载
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').length;
    });
    
    tests.push({
      name: '资源加载',
      passed: resources > 0,
      message: `加载了${resources}个资源`
    });
    
  } catch (error) {
    tests.push({
      name: '性能指标',
      passed: false,
      message: `性能测试失败: ${error.message}`
    });
  }
  
  return tests;
}

// 运行单个测试
async function runSingleTest(browser, device, pageInfo) {
  const testInfo = {
    browser: browser.name,
    device: device.name,
    page: pageInfo.name,
    url: TEST_CONFIG.baseUrl + pageInfo.path,
    viewport: device.viewport
  };
  
  log.test(`测试: ${testInfo.browser} - ${testInfo.device} - ${testInfo.page}`);
  
  const context = await browser.engine.launch();
  const page = await context.newPage();
  
  try {
    const allTests = [
      ...(await testBasicFunctionality(page, testInfo)),
      ...(await testResponsiveDesign(page, testInfo)),
      ...(await testInteractivity(page, testInfo)),
      ...(await testPerformanceMetrics(page, testInfo))
    ];
    
    const passed = allTests.filter(test => test.passed).length;
    const failed = allTests.filter(test => !test.passed).length;
    
    const result = {
      ...testInfo,
      timestamp: new Date().toISOString(),
      tests: allTests,
      summary: {
        total: allTests.length,
        passed,
        failed,
        passRate: ((passed / allTests.length) * 100).toFixed(1)
      }
    };
    
    compatibilityResults.tests.push(result);
    compatibilityResults.summary.total++;
    
    if (failed === 0) {
      log.success(`通过 (${passed}/${allTests.length})`);
      compatibilityResults.summary.passed++;
    } else {
      log.error(`失败 (${passed}/${allTests.length})`);
      compatibilityResults.summary.failed++;
    }
    
  } catch (error) {
    log.error(`测试执行失败: ${error.message}`);
    compatibilityResults.summary.failed++;
  } finally {
    await context.close();
  }
}

// 运行所有兼容性测试
async function runCompatibilityTests() {
  log.info('开始兼容性测试...\n');
  
  for (const browser of TEST_CONFIG.browsers) {
    for (const device of TEST_CONFIG.devices) {
      // 跳过不兼容的组合
      if (browser.name === 'webkit' && device.name.includes('Samsung')) {
        continue; // WebKit不支持Android设备模拟
      }
      
      for (const pageInfo of TEST_CONFIG.pages) {
        await runSingleTest(browser, device, pageInfo);
      }
    }
  }
}

// 生成兼容性报告
function generateCompatibilityReport() {
  console.log('\n' + '='.repeat(70));
  console.log('🌐 兼容性测试报告');
  console.log('='.repeat(70));
  
  const { total, passed, failed } = compatibilityResults.summary;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  
  console.log(`\n📊 测试统计:`);
  console.log(`   总测试组合: ${total}`);
  console.log(`   ✅ 通过: ${passed}`);
  console.log(`   ❌ 失败: ${failed}`);
  console.log(`   📈 通过率: ${passRate}%`);
  
  // 按浏览器分组统计
  console.log(`\n📋 浏览器兼容性:`);
  const browserStats = {};
  compatibilityResults.tests.forEach(test => {
    if (!browserStats[test.browser]) {
      browserStats[test.browser] = { passed: 0, total: 0 };
    }
    browserStats[test.browser].total++;
    if (test.summary.failed === 0) {
      browserStats[test.browser].passed++;
    }
  });
  
  Object.entries(browserStats).forEach(([browser, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    const status = rate >= 90 ? '✅' : rate >= 70 ? '⚠️' : '❌';
    console.log(`   ${status} ${browser}: ${stats.passed}/${stats.total} (${rate}%)`);
  });
  
  // 设备兼容性
  console.log(`\n📱 设备兼容性:`);
  const deviceStats = {};
  compatibilityResults.tests.forEach(test => {
    if (!deviceStats[test.device]) {
      deviceStats[test.device] = { passed: 0, total: 0 };
    }
    deviceStats[test.device].total++;
    if (test.summary.failed === 0) {
      deviceStats[test.device].passed++;
    }
  });
  
  Object.entries(deviceStats).forEach(([device, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    const status = rate >= 90 ? '✅' : rate >= 70 ? '⚠️' : '❌';
    console.log(`   ${status} ${device}: ${stats.passed}/${stats.total} (${rate}%)`);
  });
  
  // 失败的测试详情
  const failedTests = compatibilityResults.tests.filter(test => test.summary.failed > 0);
  if (failedTests.length > 0) {
    console.log(`\n❌ 失败的测试:`);
    failedTests.forEach((test, index) => {
      console.log(`\n${index + 1}. ${test.browser} - ${test.device} - ${test.page}`);
      test.tests.filter(t => !t.passed).forEach(failedTest => {
        console.log(`   • ${failedTest.name}: ${failedTest.message}`);
      });
    });
  }
  
  // 优化建议
  console.log(`\n💡 优化建议:`);
  if (browserStats.firefox && browserStats.firefox.passed / browserStats.firefox.total < 0.9) {
    console.log(`   • 优化Firefox兼容性 - 检查CSS前缀和JavaScript API`);
  }
  if (browserStats.webkit && browserStats.webkit.passed / browserStats.webkit.total < 0.9) {
    console.log(`   • 优化Safari兼容性 - 检查WebKit特定问题`);
  }
  
  const mobileDevices = Object.keys(deviceStats).filter(d => d.includes('iPhone') || d.includes('Samsung'));
  const mobileFailures = mobileDevices.some(d => deviceStats[d].passed / deviceStats[d].total < 0.9);
  if (mobileFailures) {
    console.log(`   • 优化移动端兼容性 - 检查触摸事件和视口设置`);
  }
  
  console.log('\n' + '='.repeat(70));
  
  return failed === 0;
}

// 保存测试结果
function saveCompatibilityResults() {
  const reportPath = path.join(process.cwd(), 'test-results', 'compatibility-report.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(compatibilityResults, null, 2));
  log.info(`兼容性测试结果已保存到: ${reportPath}`);
}

// 主函数
async function main() {
  try {
    console.log('🌐 开始自动化兼容性测试...\n');
    
    await runCompatibilityTests();
    const allPassed = generateCompatibilityReport();
    saveCompatibilityResults();
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    log.error(`兼容性测试失败: ${error.message}`);
    process.exit(1);
  }
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

// 启动测试
if (require.main === module) {
  checkLocalServer().then(serverRunning => {
    if (!serverRunning) {
      log.error('本地服务器未运行，请先启动: npm run dev');
      process.exit(1);
    }
    main();
  });
}

module.exports = {
  runCompatibilityTests,
  generateCompatibilityReport,
  runSingleTest
};
