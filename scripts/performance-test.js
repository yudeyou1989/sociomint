/**
 * 自动化性能测试脚本
 * 使用Lighthouse和其他工具进行性能测试
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
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
  performance: 85,
  accessibility: 95,
  bestPractices: 90,
  seo: 85,
  fcp: 1500, // 1.5s
  lcp: 2500, // 2.5s
  fid: 100,  // 100ms
  cls: 0.1   // 0.1
};

// 测试配置
const TEST_CONFIG = {
  urls: [
    'http://localhost:3000',
    'http://localhost:3000/exchange',
    'http://localhost:3000/tasks'
  ],
  devices: [
    'desktop',
    'mobile'
  ]
};

// 性能测试结果
const performanceResults = {
  tests: [],
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// 启动Chrome
async function launchChrome() {
  return await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
  });
}

// 运行Lighthouse测试
async function runLighthouseTest(url, device = 'desktop') {
  log.info(`测试 ${url} (${device})`);
  
  const chrome = await launchChrome();
  
  const config = {
    extends: 'lighthouse:default',
    settings: {
      formFactor: device,
      throttling: device === 'mobile' ? {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4
      } : {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1
      },
      screenEmulation: device === 'mobile' ? {
        mobile: true,
        width: 375,
        height: 667,
        deviceScaleFactor: 2
      } : {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1
      }
    }
  };

  try {
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      disableDeviceEmulation: false,
      chromeFlags: ['--disable-mobile-emulation']
    }, config);

    await chrome.kill();

    if (!runnerResult || !runnerResult.lhr) {
      throw new Error('Lighthouse测试失败');
    }

    return runnerResult.lhr;
  } catch (error) {
    await chrome.kill();
    throw error;
  }
}

// 分析Lighthouse结果
function analyzeLighthouseResult(result, url, device) {
  const scores = {
    performance: Math.round(result.categories.performance.score * 100),
    accessibility: Math.round(result.categories.accessibility.score * 100),
    bestPractices: Math.round(result.categories['best-practices'].score * 100),
    seo: Math.round(result.categories.seo.score * 100)
  };

  const metrics = {
    fcp: result.audits['first-contentful-paint'].numericValue,
    lcp: result.audits['largest-contentful-paint'].numericValue,
    fid: result.audits['max-potential-fid'].numericValue,
    cls: result.audits['cumulative-layout-shift'].numericValue,
    tti: result.audits['interactive'].numericValue,
    tbt: result.audits['total-blocking-time'].numericValue
  };

  const testResult = {
    url,
    device,
    timestamp: new Date().toISOString(),
    scores,
    metrics,
    passed: true,
    issues: []
  };

  // 检查分数
  Object.entries(scores).forEach(([category, score]) => {
    const threshold = PERFORMANCE_THRESHOLDS[category];
    if (score < threshold) {
      testResult.passed = false;
      testResult.issues.push({
        type: 'score',
        category,
        actual: score,
        expected: threshold,
        severity: score < threshold * 0.8 ? 'high' : 'medium'
      });
    }
  });

  // 检查核心指标
  Object.entries(metrics).forEach(([metric, value]) => {
    const threshold = PERFORMANCE_THRESHOLDS[metric];
    if (threshold && value > threshold) {
      testResult.passed = false;
      testResult.issues.push({
        type: 'metric',
        metric,
        actual: Math.round(value),
        expected: threshold,
        severity: value > threshold * 1.5 ? 'high' : 'medium'
      });
    }
  });

  return testResult;
}

// 运行所有性能测试
async function runPerformanceTests() {
  log.info('开始性能测试...\n');

  for (const url of TEST_CONFIG.urls) {
    for (const device of TEST_CONFIG.devices) {
      try {
        const result = await runLighthouseTest(url, device);
        const analysis = analyzeLighthouseResult(result, url, device);
        
        performanceResults.tests.push(analysis);
        
        if (analysis.passed) {
          log.success(`${url} (${device}) - 通过`);
          performanceResults.summary.passed++;
        } else {
          log.error(`${url} (${device}) - 失败`);
          performanceResults.summary.failed++;
        }

        // 显示关键指标
        log.metric(`性能分数: ${analysis.scores.performance}/100`);
        log.metric(`FCP: ${Math.round(analysis.metrics.fcp)}ms`);
        log.metric(`LCP: ${Math.round(analysis.metrics.lcp)}ms`);
        
        console.log(); // 空行分隔
        
      } catch (error) {
        log.error(`测试失败 ${url} (${device}): ${error.message}`);
        performanceResults.summary.failed++;
      }
    }
  }
}

// 生成性能报告
function generatePerformanceReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 性能测试报告');
  console.log('='.repeat(70));

  const { passed, failed } = performanceResults.summary;
  const total = passed + failed;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  console.log(`\n📈 测试统计:`);
  console.log(`   总测试数: ${total}`);
  console.log(`   ✅ 通过: ${passed}`);
  console.log(`   ❌ 失败: ${failed}`);
  console.log(`   📊 通过率: ${passRate}%`);

  // 详细结果
  console.log(`\n📋 详细结果:`);
  performanceResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`\n${index + 1}. ${status} ${test.url} (${test.device})`);
    console.log(`   性能: ${test.scores.performance}/100`);
    console.log(`   可访问性: ${test.scores.accessibility}/100`);
    console.log(`   最佳实践: ${test.scores.bestPractices}/100`);
    console.log(`   SEO: ${test.scores.seo}/100`);
    console.log(`   FCP: ${Math.round(test.metrics.fcp)}ms`);
    console.log(`   LCP: ${Math.round(test.metrics.lcp)}ms`);

    if (test.issues.length > 0) {
      console.log(`   ⚠️  问题:`);
      test.issues.forEach(issue => {
        if (issue.type === 'score') {
          console.log(`      ${issue.category}: ${issue.actual}/100 (期望: ${issue.expected})`);
        } else {
          console.log(`      ${issue.metric}: ${issue.actual}ms (期望: <${issue.expected}ms)`);
        }
      });
    }
  });

  // 优化建议
  console.log(`\n💡 优化建议:`);
  const allIssues = performanceResults.tests.flatMap(test => test.issues);
  const issueTypes = {};
  
  allIssues.forEach(issue => {
    const key = issue.type === 'score' ? issue.category : issue.metric;
    issueTypes[key] = (issueTypes[key] || 0) + 1;
  });

  if (issueTypes.performance) {
    console.log(`   • 优化JavaScript执行时间`);
    console.log(`   • 启用代码分割和懒加载`);
    console.log(`   • 压缩和优化资源`);
  }

  if (issueTypes.lcp) {
    console.log(`   • 优化最大内容绘制 - 压缩图片，使用CDN`);
  }

  if (issueTypes.fcp) {
    console.log(`   • 优化首次内容绘制 - 减少阻塞资源`);
  }

  if (issueTypes.cls) {
    console.log(`   • 优化累积布局偏移 - 为图片设置尺寸`);
  }

  console.log('\n' + '='.repeat(70));

  return failed === 0;
}

// 保存测试结果
function saveTestResults() {
  const reportPath = path.join(process.cwd(), 'test-results', 'performance-report.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(performanceResults, null, 2));
  log.info(`测试结果已保存到: ${reportPath}`);
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始自动化性能测试...\n');
    
    await runPerformanceTests();
    const allPassed = generatePerformanceReport();
    saveTestResults();
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    log.error(`性能测试失败: ${error.message}`);
    process.exit(1);
  }
}

// 检查是否有本地服务器运行
function checkLocalServer() {
  const http = require('http');
  
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
  runPerformanceTests,
  generatePerformanceReport,
  runLighthouseTest
};
