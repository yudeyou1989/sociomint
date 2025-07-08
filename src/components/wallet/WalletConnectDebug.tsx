'use client';

import { useState } from 'react';

/**
 * WalletConnect 调试组件
 * 用于测试和调试WalletConnect连接问题
 */
const WalletConnectDebug = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const testWalletConnect = async () => {
    setIsConnecting(true);
    setDebugInfo([]);
    
    try {
      addDebugInfo('开始测试WalletConnect连接...');
      
      // 检查环境变量
      const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
      addDebugInfo(`项目ID: ${projectId ? '已配置' : '未配置'}`);
      
      if (!projectId) {
        addDebugInfo('错误: 未找到WalletConnect项目ID');
        return;
      }

      // 动态导入WalletConnect
      addDebugInfo('正在加载WalletConnect库...');
      const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
      addDebugInfo('WalletConnect库加载成功');

      // 创建提供者
      addDebugInfo('正在创建EthereumProvider...');
      const provider = await EthereumProvider.init({
        projectId,
        showQrModal: true,
        chains: [56], // BSC Mainnet
        optionalChains: [1, 97], // Ethereum Mainnet, BSC Testnet
        methods: [
          'eth_sendTransaction',
          'eth_sign',
          'personal_sign',
          'eth_signTypedData',
        ],
        events: [
          'chainChanged',
          'accountsChanged',
        ],
        qrModalOptions: {
          themeMode: 'dark',
          themeVariables: {
            '--wcm-z-index': '99999999',
            '--wcm-font-family': '"Inter", system-ui, sans-serif',
            '--wcm-background-color': '#1a1a1a',
            '--wcm-accent-color': '#0de5ff',
            '--wcm-text-color': '#ffffff',
            '--wcm-border-radius-master': '12px',
          },
        }
      });
      
      addDebugInfo('EthereumProvider创建成功');

      // 设置事件监听器
      provider.on('connect', (info: { chainId: number }) => {
        addDebugInfo(`连接成功，链ID: ${info.chainId}`);
      });

      provider.on('disconnect', () => {
        addDebugInfo('连接断开');
      });

      provider.on('accountsChanged', (accounts: string[]) => {
        addDebugInfo(`账户变更: ${accounts.length} 个账户`);
      });

      provider.on('chainChanged', (chainId: number) => {
        addDebugInfo(`链变更: ${chainId}`);
      });

      // 请求连接
      addDebugInfo('正在请求连接...');
      await provider.enable();
      
      const accounts = await provider.getAccounts();
      addDebugInfo(`获取到账户: ${accounts.length} 个`);
      
      if (accounts && accounts.length > 0) {
        addDebugInfo(`连接成功! 地址: ${accounts[0]}`);
        addDebugInfo(`链ID: ${provider.chainId}`);
      } else {
        addDebugInfo('警告: 未获取到账户');
      }

    } catch (error: any) {
      addDebugInfo(`错误: ${error.message}`);
      console.error('WalletConnect测试失败:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  const checkEnvironment = () => {
    setDebugInfo([]);
    addDebugInfo('=== 环境检查 ===');
    
    // 检查浏览器环境
    addDebugInfo(`浏览器环境: ${typeof window !== 'undefined' ? '是' : '否'}`);
    
    // 检查环境变量
    const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
    addDebugInfo(`WalletConnect项目ID: ${projectId || '未设置'}`);
    
    // 检查其他相关环境变量
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
    addDebugInfo(`链ID: ${chainId || '未设置'}`);
    
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    addDebugInfo(`RPC URL: ${rpcUrl || '未设置'}`);
    
    // 检查CSS变量
    if (typeof window !== 'undefined') {
      const root = getComputedStyle(document.documentElement);
      const wcmZIndex = root.getPropertyValue('--wcm-z-index');
      addDebugInfo(`CSS --wcm-z-index: ${wcmZIndex || '未设置'}`);
    }
    
    addDebugInfo('=== 检查完成 ===');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md z-50">
      <h3 className="text-white font-bold mb-3">WalletConnect 调试</h3>
      
      <div className="flex gap-2 mb-3">
        <button
          onClick={checkEnvironment}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          检查环境
        </button>
        <button
          onClick={testWalletConnect}
          disabled={isConnecting}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {isConnecting ? '连接中...' : '测试连接'}
        </button>
        <button
          onClick={clearDebugInfo}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          清除
        </button>
      </div>

      <div className="bg-black rounded p-2 max-h-40 overflow-y-auto">
        {debugInfo.length === 0 ? (
          <div className="text-gray-400 text-sm">点击按钮开始调试...</div>
        ) : (
          debugInfo.map((info, index) => (
            <div key={index} className="text-green-400 text-xs mb-1 font-mono">
              {info}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WalletConnectDebug;
