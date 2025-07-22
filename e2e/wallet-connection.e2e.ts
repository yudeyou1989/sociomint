/**
 * 钱包连接E2E测试
 * 测试钱包连接、断开连接、网络切换等完整流程
 */

import { test, expect, Page } from '@playwright/test';

// 测试数据
const TEST_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';
const BSC_CHAIN_ID = '0x38';
const ETH_CHAIN_ID = '0x1';

// Mock MetaMask响应
const mockMetaMaskResponses = {
  eth_requestAccounts: [TEST_WALLET_ADDRESS],
  eth_accounts: [TEST_WALLET_ADDRESS],
  eth_chainId: BSC_CHAIN_ID,
  net_version: '56',
  eth_getBalance: '0x1bc16d674ec80000', // 2 ETH in wei
  wallet_switchEthereumChain: null,
  wallet_addEthereumChain: null
};

// 设置Mock MetaMask
async function setupMockWallet(page: Page) {
  await page.addInitScript(() => {
    // Mock window.ethereum
    (window as any).ethereum = {
      isMetaMask: true,
      isConnected: () => true,
      selectedAddress: null,
      chainId: '0x38',
      
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        const responses: Record<string, any> = {
          eth_requestAccounts: ['0x1234567890123456789012345678901234567890'],
          eth_accounts: ['0x1234567890123456789012345678901234567890'],
          eth_chainId: '0x38',
          net_version: '56',
          eth_getBalance: '0x1bc16d674ec80000',
          wallet_switchEthereumChain: null,
          wallet_addEthereumChain: null
        };
        
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (method === 'wallet_switchEthereumChain') {
          // 模拟网络切换
          (window as any).ethereum.chainId = params?.[0]?.chainId || '0x38';
          (window as any).ethereum.emit('chainChanged', (window as any).ethereum.chainId);
          return null;
        }
        
        if (method === 'eth_requestAccounts') {
          // 模拟连接成功
          (window as any).ethereum.selectedAddress = responses[method][0];
          (window as any).ethereum.emit('accountsChanged', responses[method]);
        }
        
        return responses[method] || null;
      },
      
      on: (event: string, handler: Function) => {
        (window as any).ethereum._events = (window as any).ethereum._events || {};
        (window as any).ethereum._events[event] = (window as any).ethereum._events[event] || [];
        (window as any).ethereum._events[event].push(handler);
      },
      
      removeListener: (event: string, handler: Function) => {
        if ((window as any).ethereum._events?.[event]) {
          const index = (window as any).ethereum._events[event].indexOf(handler);
          if (index > -1) {
            (window as any).ethereum._events[event].splice(index, 1);
          }
        }
      },
      
      emit: (event: string, ...args: any[]) => {
        if ((window as any).ethereum._events?.[event]) {
          (window as any).ethereum._events[event].forEach((handler: Function) => {
            handler(...args);
          });
        }
      }
    };
  });
}

test.describe('钱包连接功能', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockWallet(page);
    await page.goto('/');
  });

  test('应该显示连接钱包按钮', async ({ page }) => {
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查连接钱包按钮是否存在
    const connectButton = page.locator('button:has-text("连接钱包")');
    await expect(connectButton).toBeVisible();
  });

  test('点击连接钱包应该成功连接', async ({ page }) => {
    // 点击连接钱包按钮
    const connectButton = page.locator('button:has-text("连接钱包")');
    await connectButton.click();
    
    // 等待连接完成
    await page.waitForTimeout(500);
    
    // 检查是否显示钱包地址
    const walletAddress = page.locator('text=/0x1234...7890/');
    await expect(walletAddress).toBeVisible();
    
    // 检查是否显示断开连接按钮
    const disconnectButton = page.locator('button:has-text("断开连接")');
    await expect(disconnectButton).toBeVisible();
  });

  test('应该显示钱包余额', async ({ page }) => {
    // 先连接钱包
    const connectButton = page.locator('button:has-text("连接钱包")');
    await connectButton.click();
    await page.waitForTimeout(500);
    
    // 检查是否显示余额信息
    const balanceInfo = page.locator('text=/BNB/');
    await expect(balanceInfo).toBeVisible();
  });

  test('断开连接应该清除钱包状态', async ({ page }) => {
    // 先连接钱包
    const connectButton = page.locator('button:has-text("连接钱包")');
    await connectButton.click();
    await page.waitForTimeout(500);
    
    // 点击断开连接
    const disconnectButton = page.locator('button:has-text("断开连接")');
    await disconnectButton.click();
    await page.waitForTimeout(500);
    
    // 检查是否回到未连接状态
    const newConnectButton = page.locator('button:has-text("连接钱包")');
    await expect(newConnectButton).toBeVisible();
    
    // 检查钱包地址是否消失
    const walletAddress = page.locator('text=/0x1234...7890/');
    await expect(walletAddress).not.toBeVisible();
  });

  test('错误网络时应该显示切换网络按钮', async ({ page }) => {
    // 修改Mock返回错误的网络ID
    await page.addInitScript(() => {
      (window as any).ethereum.chainId = '0x1'; // Ethereum主网
    });
    
    // 连接钱包
    const connectButton = page.locator('button:has-text("连接钱包")');
    await connectButton.click();
    await page.waitForTimeout(500);
    
    // 检查是否显示切换网络按钮
    const switchNetworkButton = page.locator('button:has-text("切换到BSC网络")');
    await expect(switchNetworkButton).toBeVisible();
  });

  test('切换网络应该成功', async ({ page }) => {
    // 设置错误网络
    await page.addInitScript(() => {
      (window as any).ethereum.chainId = '0x1';
    });
    
    // 连接钱包
    const connectButton = page.locator('button:has-text("连接钱包")');
    await connectButton.click();
    await page.waitForTimeout(500);
    
    // 点击切换网络
    const switchNetworkButton = page.locator('button:has-text("切换到BSC网络")');
    await switchNetworkButton.click();
    await page.waitForTimeout(500);
    
    // 检查切换网络按钮是否消失
    await expect(switchNetworkButton).not.toBeVisible();
  });

  test('未安装钱包时应该显示安装提示', async ({ page }) => {
    // 移除Mock钱包
    await page.addInitScript(() => {
      delete (window as any).ethereum;
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 检查是否显示安装提示
    const installPrompt = page.locator('text=/请安装MetaMask/');
    await expect(installPrompt).toBeVisible();
  });

  test('连接过程中应该显示加载状态', async ({ page }) => {
    // 修改Mock以增加延迟
    await page.addInitScript(() => {
      const originalRequest = (window as any).ethereum.request;
      (window as any).ethereum.request = async (args: any) => {
        if (args.method === 'eth_requestAccounts') {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return originalRequest(args);
      };
    });
    
    // 点击连接钱包
    const connectButton = page.locator('button:has-text("连接钱包")');
    await connectButton.click();
    
    // 检查是否显示加载状态
    const loadingText = page.locator('text=/连接中/');
    await expect(loadingText).toBeVisible();
    
    // 等待连接完成
    await page.waitForTimeout(1500);
    await expect(loadingText).not.toBeVisible();
  });

  test('应该正确处理用户拒绝连接', async ({ page }) => {
    // 修改Mock以模拟用户拒绝
    await page.addInitScript(() => {
      (window as any).ethereum.request = async ({ method }: { method: string }) => {
        if (method === 'eth_requestAccounts') {
          throw new Error('User rejected the request');
        }
        return null;
      };
    });
    
    // 点击连接钱包
    const connectButton = page.locator('button:has-text("连接钱包")');
    await connectButton.click();
    await page.waitForTimeout(500);
    
    // 检查是否显示错误信息
    const errorMessage = page.locator('text=/连接失败/');
    await expect(errorMessage).toBeVisible();
  });

  test('页面刷新后应该保持连接状态', async ({ page }) => {
    // 连接钱包
    const connectButton = page.locator('button:has-text("连接钱包")');
    await connectButton.click();
    await page.waitForTimeout(500);
    
    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 检查是否仍然显示已连接状态
    const walletAddress = page.locator('text=/0x1234...7890/');
    await expect(walletAddress).toBeVisible();
  });
});

test.describe('钱包连接响应式测试', () => {
  test('移动端钱包连接', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await setupMockWallet(page);
    await page.goto('/');
    
    // 测试移动端的钱包连接
    const connectButton = page.locator('button:has-text("连接钱包")');
    await expect(connectButton).toBeVisible();
    
    await connectButton.click();
    await page.waitForTimeout(500);
    
    // 检查移动端显示
    const walletInfo = page.locator('text=/0x1234...7890/');
    await expect(walletInfo).toBeVisible();
  });

  test('平板端钱包连接', async ({ page }) => {
    // 设置平板端视口
    await page.setViewportSize({ width: 768, height: 1024 });
    await setupMockWallet(page);
    await page.goto('/');
    
    // 测试平板端的钱包连接
    const connectButton = page.locator('button:has-text("连接钱包")');
    await connectButton.click();
    await page.waitForTimeout(500);
    
    const walletInfo = page.locator('text=/0x1234...7890/');
    await expect(walletInfo).toBeVisible();
  });
});

test.describe('钱包连接可访问性测试', () => {
  test('键盘导航支持', async ({ page }) => {
    await setupMockWallet(page);
    await page.goto('/');
    
    // 使用Tab键导航到连接按钮
    await page.keyboard.press('Tab');
    
    // 检查焦点是否在连接按钮上
    const connectButton = page.locator('button:has-text("连接钱包")');
    await expect(connectButton).toBeFocused();
    
    // 使用Enter键激活按钮
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // 检查连接是否成功
    const walletAddress = page.locator('text=/0x1234...7890/');
    await expect(walletAddress).toBeVisible();
  });

  test('屏幕阅读器支持', async ({ page }) => {
    await setupMockWallet(page);
    await page.goto('/');
    
    // 检查按钮是否有正确的aria标签
    const connectButton = page.locator('button:has-text("连接钱包")');
    await expect(connectButton).toHaveAttribute('aria-label');
  });
});
