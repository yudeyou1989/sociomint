import { chromium, FullConfig } from '@playwright/test';

/**
 * Playwright 全局设置
 * 在所有测试开始前执行
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test global setup...');
  
  // 启动浏览器进行预热
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 等待应用启动
    console.log('⏳ Waiting for application to be ready...');
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000');
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 检查应用是否正常运行
    const title = await page.title();
    console.log(`✅ Application is ready. Page title: ${title}`);
    
    // 预加载关键资源
    await page.evaluate(() => {
      // 预加载字体和关键 CSS
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = '/styles/globals.css';
      document.head.appendChild(link);
    });
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('✅ E2E test global setup completed');
}

export default globalSetup;
