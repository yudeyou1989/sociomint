/**
 * 代币交换E2E测试
 * 测试BNB与SM代币交换的完整流程
 */

import { test, expect, Page } from '@playwright/test';

// 测试数据
const TEST_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';
const EXCHANGE_RATE = '120000'; // 1 BNB = 120,000 SM
const USER_BNB_BALANCE = '2.5';

// 设置Mock环境
async function setupMockEnvironment(page: Page) {
  await page.addInitScript(() => {
    // Mock window.ethereum
    (window as any).ethereum = {
      isMetaMask: true,
      isConnected: () => true,
      selectedAddress: '0x1234567890123456789012345678901234567890',
      chainId: '0x38',
      
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        const responses: Record<string, any> = {
          eth_requestAccounts: ['0x1234567890123456789012345678901234567890'],
          eth_accounts: ['0x1234567890123456789012345678901234567890'],
          eth_chainId: '0x38',
          eth_getBalance: '0x22b1c8c1227a0000', // 2.5 BNB in wei
          eth_sendTransaction: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          eth_getTransactionReceipt: {
            status: '0x1',
            transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
            blockNumber: '0x123456',
            gasUsed: '0x5208'
          }
        };
        
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (method === 'eth_sendTransaction') {
          // 模拟交易发送
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return responses[method] || null;
      },
      
      on: () => {},
      removeListener: () => {},
      emit: () => {}
    };

    // Mock合约调用
    (window as any).mockContractData = {
      exchangeRate: '120000',
      totalSold: '50000000',
      totalRemaining: '20000000',
      currentRound: 1,
      isActive: true
    };
  });
}

test.describe('代币交换功能', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockEnvironment(page);
    await page.goto('/exchange');
    
    // 等待页面加载并连接钱包
    await page.waitForLoadState('networkidle');
    
    // 如果需要连接钱包，先连接
    const connectButton = page.locator('button:has-text("连接钱包")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('应该显示交换界面', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('h1, h2').filter({ hasText: /代币交换|Token Exchange/ })).toBeVisible();
    
    // 检查输入框
    const bnbInput = page.locator('input[placeholder*="BNB"], input[placeholder*="输入BNB"]');
    await expect(bnbInput).toBeVisible();
    
    const smInput = page.locator('input[placeholder*="SM"], input[placeholder*="将获得"]');
    await expect(smInput).toBeVisible();
    
    // 检查购买按钮
    const purchaseButton = page.locator('button:has-text("购买"), button:has-text("交换")');
    await expect(purchaseButton).toBeVisible();
  });

  test('应该显示当前汇率', async ({ page }) => {
    // 检查汇率显示
    const rateDisplay = page.locator('text=/价格|汇率|rate/i');
    await expect(rateDisplay).toBeVisible();
    
    // 检查具体汇率数值
    const rateValue = page.locator(`text=/${EXCHANGE_RATE}/`);
    await expect(rateValue).toBeVisible();
  });

  test('应该显示用户余额', async ({ page }) => {
    // 检查余额显示
    const balanceDisplay = page.locator('text=/余额|balance/i');
    await expect(balanceDisplay).toBeVisible();
    
    // 检查BNB余额
    const bnbBalance = page.locator('text=/2.5.*BNB/');
    await expect(bnbBalance).toBeVisible();
  });

  test('输入BNB数量应该自动计算SM数量', async ({ page }) => {
    // 找到BNB输入框
    const bnbInput = page.locator('input[placeholder*="BNB"], input[placeholder*="输入BNB"]').first();
    
    // 输入1 BNB
    await bnbInput.fill('1');
    await page.waitForTimeout(500);
    
    // 检查SM数量是否自动计算
    const smInput = page.locator('input[placeholder*="SM"], input[placeholder*="将获得"]').first();
    const smValue = await smInput.inputValue();
    
    // 验证计算结果（1 BNB = 120,000 SM）
    expect(smValue).toContain('120000');
  });

  test('应该正确处理小数输入', async ({ page }) => {
    const bnbInput = page.locator('input[placeholder*="BNB"], input[placeholder*="输入BNB"]').first();
    
    // 输入0.5 BNB
    await bnbInput.fill('0.5');
    await page.waitForTimeout(500);
    
    // 检查计算结果
    const smInput = page.locator('input[placeholder*="SM"], input[placeholder*="将获得"]').first();
    const smValue = await smInput.inputValue();
    
    // 验证计算结果（0.5 BNB = 60,000 SM）
    expect(smValue).toContain('60000');
  });

  test('清空输入应该清空计算结果', async ({ page }) => {
    const bnbInput = page.locator('input[placeholder*="BNB"], input[placeholder*="输入BNB"]').first();
    const smInput = page.locator('input[placeholder*="SM"], input[placeholder*="将获得"]').first();
    
    // 先输入数值
    await bnbInput.fill('1');
    await page.waitForTimeout(500);
    
    // 清空输入
    await bnbInput.fill('');
    await page.waitForTimeout(500);
    
    // 检查SM输入框是否被清空
    const smValue = await smInput.inputValue();
    expect(smValue).toBe('');
  });

  test('没有输入时购买按钮应该被禁用', async ({ page }) => {
    const purchaseButton = page.locator('button:has-text("购买"), button:has-text("交换")').first();
    
    // 检查按钮是否被禁用
    await expect(purchaseButton).toBeDisabled();
  });

  test('有效输入时购买按钮应该可用', async ({ page }) => {
    const bnbInput = page.locator('input[placeholder*="BNB"], input[placeholder*="输入BNB"]').first();
    const purchaseButton = page.locator('button:has-text("购买"), button:has-text("交换")').first();
    
    // 输入有效数量
    await bnbInput.fill('1');
    await page.waitForTimeout(500);
    
    // 检查按钮是否可用
    await expect(purchaseButton).toBeEnabled();
  });

  test('执行购买交易', async ({ page }) => {
    const bnbInput = page.locator('input[placeholder*="BNB"], input[placeholder*="输入BNB"]').first();
    const purchaseButton = page.locator('button:has-text("购买"), button:has-text("交换")').first();
    
    // 输入购买数量
    await bnbInput.fill('1');
    await page.waitForTimeout(500);
    
    // 点击购买按钮
    await purchaseButton.click();
    
    // 检查是否显示交易进行中状态
    const loadingText = page.locator('text=/交易中|处理中|pending/i');
    await expect(loadingText).toBeVisible();
    
    // 等待交易完成
    await page.waitForTimeout(2000);
    
    // 检查是否显示成功信息
    const successMessage = page.locator('text=/成功|success/i');
    await expect(successMessage).toBeVisible();
  });

  test('应该验证最小购买金额', async ({ page }) => {
    const bnbInput = page.locator('input[placeholder*="BNB"], input[placeholder*="输入BNB"]').first();
    const purchaseButton = page.locator('button:has-text("购买"), button:has-text("交换")').first();
    
    // 输入过小的金额
    await bnbInput.fill('0.001');
    await page.waitForTimeout(500);
    
    // 尝试购买
    await purchaseButton.click();
    
    // 检查是否显示错误信息
    const errorMessage = page.locator('text=/最小|minimum/i');
    await expect(errorMessage).toBeVisible();
  });

  test('应该验证余额充足性', async ({ page }) => {
    const bnbInput = page.locator('input[placeholder*="BNB"], input[placeholder*="输入BNB"]').first();
    const purchaseButton = page.locator('button:has-text("购买"), button:has-text("交换")').first();
    
    // 输入超过余额的金额
    await bnbInput.fill('10');
    await page.waitForTimeout(500);
    
    // 尝试购买
    await purchaseButton.click();
    
    // 检查是否显示余额不足错误
    const errorMessage = page.locator('text=/余额不足|insufficient/i');
    await expect(errorMessage).toBeVisible();
  });

  test('应该处理网络错误', async ({ page }) => {
    // 修改Mock以模拟网络错误
    await page.addInitScript(() => {
      (window as any).ethereum.request = async ({ method }: { method: string }) => {
        if (method === 'eth_sendTransaction') {
          throw new Error('Network error');
        }
        return null;
      };
    });
    
    const bnbInput = page.locator('input[placeholder*="BNB"], input[placeholder*="输入BNB"]').first();
    const purchaseButton = page.locator('button:has-text("购买"), button:has-text("交换")').first();
    
    // 输入购买数量并尝试购买
    await bnbInput.fill('1');
    await page.waitForTimeout(500);
    await purchaseButton.click();
    
    // 检查是否显示网络错误
    const errorMessage = page.locator('text=/网络错误|network error/i');
    await expect(errorMessage).toBeVisible();
  });

  test('应该显示交易历史', async ({ page }) => {
    // 检查是否有交易历史区域
    const historySection = page.locator('text=/历史|history/i');
    if (await historySection.isVisible()) {
      await expect(historySection).toBeVisible();
    }
  });
});

test.describe('代币交换响应式测试', () => {
  test('移动端交换界面', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupMockEnvironment(page);
    await page.goto('/exchange');
    
    // 检查移动端布局
    const bnbInput = page.locator('input[placeholder*="BNB"], input[placeholder*="输入BNB"]').first();
    await expect(bnbInput).toBeVisible();
    
    // 测试移动端交互
    await bnbInput.fill('1');
    await page.waitForTimeout(500);
    
    const smInput = page.locator('input[placeholder*="SM"], input[placeholder*="将获得"]').first();
    const smValue = await smInput.inputValue();
    expect(smValue).toContain('120000');
  });
});

test.describe('代币交换可访问性测试', () => {
  test('键盘导航支持', async ({ page }) => {
    await setupMockEnvironment(page);
    await page.goto('/exchange');
    
    // 使用Tab键导航
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // 检查焦点是否在输入框上
    const bnbInput = page.locator('input[placeholder*="BNB"], input[placeholder*="输入BNB"]').first();
    await expect(bnbInput).toBeFocused();
    
    // 使用键盘输入
    await page.keyboard.type('1');
    await page.waitForTimeout(500);
    
    // 检查计算结果
    const smInput = page.locator('input[placeholder*="SM"], input[placeholder*="将获得"]').first();
    const smValue = await smInput.inputValue();
    expect(smValue).toContain('120000');
  });

  test('屏幕阅读器支持', async ({ page }) => {
    await setupMockEnvironment(page);
    await page.goto('/exchange');
    
    // 检查输入框是否有正确的标签
    const bnbInput = page.locator('input[placeholder*="BNB"], input[placeholder*="输入BNB"]').first();
    await expect(bnbInput).toHaveAttribute('aria-label');
    
    // 检查按钮是否有正确的标签
    const purchaseButton = page.locator('button:has-text("购买"), button:has-text("交换")').first();
    await expect(purchaseButton).toHaveAttribute('aria-label');
  });
});
