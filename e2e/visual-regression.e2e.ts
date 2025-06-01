import { test, expect } from '@playwright/test';

/**
 * 视觉回归测试
 * 通过截图对比检测 UI 变化
 */
test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 设置一致的视口大小
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // 禁用动画以确保截图一致性
    await page.addInitScript(() => {
      // 禁用 CSS 动画
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });
  });

  test('homepage visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 等待字体加载
    await page.waitForTimeout(1000);
    
    // 隐藏动态内容（如时间戳）
    await page.addStyleTag({
      content: `
        [data-testid="timestamp"],
        .timestamp,
        .time {
          visibility: hidden !important;
        }
      `
    });
    
    // 截图对比
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('exchange page visual snapshot', async ({ page }) => {
    await page.goto('/exchange');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 隐藏动态内容
    await page.addStyleTag({
      content: `
        [data-testid="price"],
        [data-testid="balance"],
        .price,
        .balance {
          visibility: hidden !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('exchange-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('mobile homepage visual snapshot', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('wallet connection modal visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 查找并点击连接钱包按钮
    const connectButton = page.locator('button').filter({ hasText: /连接钱包|Connect Wallet/ }).first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      
      // 等待模态框出现
      const modal = page.locator('[data-testid="wallet-modal"]').first();
      if (await modal.isVisible()) {
        await expect(modal).toBeVisible();
        
        // 截图模态框
        await expect(modal).toHaveScreenshot('wallet-modal.png', {
          animations: 'disabled',
        });
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('form validation states visual snapshot', async ({ page }) => {
    await page.goto('/exchange');
    await page.waitForLoadState('networkidle');
    
    // 查找表单输入
    const amountInput = page.locator('input[type="number"]').first();
    
    if (await amountInput.isVisible()) {
      // 输入无效值触发验证
      await amountInput.fill('0.001');
      await page.keyboard.press('Tab');
      
      // 等待验证消息出现
      await page.waitForTimeout(500);
      
      // 截图表单验证状态
      await expect(page.locator('form').first()).toHaveScreenshot('form-validation.png', {
        animations: 'disabled',
      });
    } else {
      test.skip();
    }
  });

  test('dark mode visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 查找暗色模式切换按钮
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]').first();
    
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('homepage-dark.png', {
        fullPage: true,
        animations: 'disabled',
      });
    } else {
      // 手动设置暗色模式
      await page.addStyleTag({
        content: `
          html { color-scheme: dark; }
          body { background: #1a1a1a; color: #ffffff; }
        `
      });
      
      await expect(page).toHaveScreenshot('homepage-dark-manual.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('loading states visual snapshot', async ({ page }) => {
    // 拦截 API 请求以模拟加载状态
    await page.route('**/api/**', async route => {
      // 延迟响应以捕获加载状态
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    await page.goto('/exchange');
    
    // 立即截图加载状态
    await expect(page).toHaveScreenshot('loading-state.png', {
      animations: 'disabled',
    });
  });

  test('error states visual snapshot', async ({ page }) => {
    // 模拟 API 错误
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/exchange');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 检查是否有错误状态显示
    const errorElement = page.locator('[data-testid="error-message"]').first();
    if (await errorElement.isVisible()) {
      await expect(page).toHaveScreenshot('error-state.png', {
        fullPage: true,
        animations: 'disabled',
      });
    } else {
      test.skip();
    }
  });

  test('responsive breakpoints visual snapshots', async ({ page }) => {
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'large-desktop', width: 1920, height: 1080 },
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`homepage-${breakpoint.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('component states visual snapshots', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 测试按钮状态
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      
      // 正常状态
      await expect(firstButton).toHaveScreenshot('button-normal.png');
      
      // 悬停状态
      await firstButton.hover();
      await expect(firstButton).toHaveScreenshot('button-hover.png');
      
      // 聚焦状态
      await firstButton.focus();
      await expect(firstButton).toHaveScreenshot('button-focus.png');
    }
  });

  test('cross-browser visual consistency', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 为不同浏览器生成不同的截图
    await expect(page).toHaveScreenshot(`homepage-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.3, // 允许更大的差异以适应浏览器差异
    });
  });
});
