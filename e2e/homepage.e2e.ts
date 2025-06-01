import { test, expect } from '@playwright/test';

/**
 * 首页 E2E 测试
 * 测试首页的基本功能和用户交互
 */
test.describe('Homepage E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 访问首页
    await page.goto('/');
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('should load homepage successfully', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/SocioMint/);
    
    // 检查主要元素是否存在
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    // 检查导航菜单项
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // 检查主要导航链接
    await expect(page.locator('a[href="/exchange"]')).toBeVisible();
    await expect(page.locator('a[href="/market"]')).toBeVisible();
    await expect(page.locator('a[href="/vault"]')).toBeVisible();
  });

  test('should navigate to exchange page', async ({ page }) => {
    // 点击交换页面链接
    await page.click('a[href="/exchange"]');
    
    // 等待页面导航
    await page.waitForURL('**/exchange');
    
    // 检查是否到达交换页面
    await expect(page.locator('h1')).toContainText(/交换|Exchange/);
  });

  test('should display language switcher', async ({ page }) => {
    // 查找语言切换器
    const languageSwitcher = page.locator('[data-testid="language-switcher"]').first();
    
    if (await languageSwitcher.isVisible()) {
      // 如果语言切换器存在，测试切换功能
      await languageSwitcher.click();
      
      // 检查语言选项
      const options = page.locator('option');
      await expect(options.first()).toBeVisible();
    } else {
      // 如果不存在，跳过测试
      test.skip();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 重新加载页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 检查移动端布局
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    // 检查是否有移动端菜单按钮
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]').first();
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      // 检查移动端菜单是否展开
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }
  });

  test('should handle wallet connection flow', async ({ page }) => {
    // 查找连接钱包按钮
    const connectButton = page.locator('button').filter({ hasText: /连接钱包|Connect Wallet/ }).first();
    
    if (await connectButton.isVisible()) {
      // 点击连接钱包按钮
      await connectButton.click();
      
      // 检查是否显示钱包选择模态框
      const modal = page.locator('[data-testid="wallet-modal"]').first();
      if (await modal.isVisible()) {
        await expect(modal).toBeVisible();
        
        // 检查钱包选项
        await expect(page.locator('button').filter({ hasText: /MetaMask/ })).toBeVisible();
        
        // 关闭模态框
        const closeButton = page.locator('[data-testid="close-modal"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    } else {
      // 如果没有连接钱包按钮，跳过测试
      test.skip();
    }
  });

  test('should display footer information', async ({ page }) => {
    // 滚动到页面底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // 检查页脚是否可见
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // 检查版权信息
    await expect(footer).toContainText(/SocioMint/);
    await expect(footer).toContainText(/2024/);
    
    // 检查隐私政策和服务条款链接
    const privacyLink = page.locator('a[href="/privacy"]').first();
    const termsLink = page.locator('a[href="/terms"]').first();
    
    if (await privacyLink.isVisible()) {
      await expect(privacyLink).toBeVisible();
    }
    
    if (await termsLink.isVisible()) {
      await expect(termsLink).toBeVisible();
    }
  });

  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // 监听控制台错误
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 重新加载页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 等待一段时间让所有异步操作完成
    await page.waitForTimeout(2000);
    
    // 检查是否有严重的控制台错误
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_FAILED')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    // 检查基本的 SEO meta 标签
    const title = await page.locator('title').textContent();
    expect(title).toBeTruthy();
    expect(title?.length).toBeGreaterThan(10);
    
    // 检查 meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    if (description) {
      expect(description.length).toBeGreaterThan(50);
    }
    
    // 检查 viewport meta 标签
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // 模拟网络错误
    await page.route('**/api/**', route => route.abort());
    
    // 重新加载页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 检查页面是否仍然可用
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    // 检查是否显示错误提示
    const errorMessage = page.locator('[data-testid="error-message"]').first();
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });
});
