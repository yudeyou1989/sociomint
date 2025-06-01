import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 * 用于端到端测试和视觉回归测试
 */
export default defineConfig({
  testDir: './e2e',
  
  /* 并行运行测试 */
  fullyParallel: true,
  
  /* 在 CI 中失败时重试 */
  retries: process.env.CI ? 2 : 0,
  
  /* 在 CI 中使用更少的 worker */
  workers: process.env.CI ? 1 : undefined,
  
  /* 测试报告配置 */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
  ],
  
  /* 全局测试配置 */
  use: {
    /* 基础 URL */
    baseURL: 'http://localhost:3000',
    
    /* 收集失败测试的追踪信息 */
    trace: 'on-first-retry',
    
    /* 截图配置 */
    screenshot: 'only-on-failure',
    
    /* 视频录制 */
    video: 'retain-on-failure',
    
    /* 浏览器上下文配置 */
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    /* 等待配置 */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* 配置不同的浏览器项目 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    /* 移动端测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 在测试开始前启动开发服务器 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  /* 输出目录 */
  outputDir: 'test-results/',
  
  /* 全局设置和清理 */
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
  
  /* 测试超时 */
  timeout: 30 * 1000,
  
  /* 期望超时 */
  expect: {
    timeout: 5000,
    toHaveScreenshot: { threshold: 0.2, mode: 'pixel' },
    toMatchSnapshot: { threshold: 0.2 },
  },
  
  /* 测试文件匹配模式 */
  testMatch: [
    '**/*.e2e.ts',
    '**/*.e2e.js',
    '**/e2e/**/*.test.ts',
    '**/e2e/**/*.test.js',
  ],
  
  /* 忽略的文件 */
  testIgnore: [
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
  ],
});
