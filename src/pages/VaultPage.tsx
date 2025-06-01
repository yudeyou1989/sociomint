import { useState, useEffect } from 'react';
import TokenVault from '../components/vault/TokenVault';
import { FaEthereum, FaWallet, FaExclamationTriangle } from 'react-icons/fa';

// 简化的区块链连接状态类型
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// 模拟区块链连接钩子
const useBlockchainConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  // 模拟连接钱包函数
  const connect = async () => {
    try {
      setStatus('connecting');

      // 模拟连接延迟
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 模拟成功连接
      setStatus('connected');
      setAccount('0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t');
      setChainId(1); // 假设是以太坊主网
    } catch (error) {
      console.error('连接钱包失败:', error);
      setStatus('error');
    }
  };

  // 断开连接
  const disconnect = () => {
    setStatus('disconnected');
    setAccount(null);
    setChainId(null);
  };

  return { status, account, chainId, connect, disconnect };
};

// 钱库页面组件
const VaultPage = () => {
  const { status, account, chainId, connect, disconnect } =
    useBlockchainConnection();

  // 处理连接按钮点击
  const handleConnectClick = () => {
    if (status === 'connected') {
      disconnect();
    } else if (status === 'disconnected' || status === 'error') {
      connect();
    }
  };

  // 获取连接状态样式和文本
  const getConnectionStatusUI = () => {
    switch (status) {
      case 'connected':
        return {
          text: '已连接',
          buttonText: '断开连接',
          icon: <FaEthereum className="mr-2" />,
          buttonClass: 'bg-green-600 hover:bg-green-700',
        };
      case 'connecting':
        return {
          text: '连接中...',
          buttonText: '连接中',
          icon: (
            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
          ),
          buttonClass: 'bg-yellow-600 hover:bg-yellow-700 cursor-wait',
        };
      case 'error':
        return {
          text: '连接失败',
          buttonText: '重试连接',
          icon: <FaExclamationTriangle className="mr-2" />,
          buttonClass: 'bg-red-600 hover:bg-red-700',
        };
      default:
        return {
          text: '未连接',
          buttonText: '连接钱包',
          icon: <FaWallet className="mr-2" />,
          buttonClass: 'bg-primary hover:bg-primary/90',
        };
    }
  };

  const statusUI = getConnectionStatusUI();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">钱库系统</h1>

        <div className="flex items-center">
          {status === 'connected' && (
            <div className="mr-4 text-sm">
              <span className="text-gray-400">账户: </span>
              <span className="font-mono">
                {account?.substring(0, 6)}...
                {account?.substring(account.length - 4)}
              </span>
            </div>
          )}

          <button
            onClick={handleConnectClick}
            className={`py-2 px-4 rounded-md text-white flex items-center ${statusUI.buttonClass}`}
          >
            {statusUI.icon}
            {statusUI.buttonText}
          </button>
        </div>
      </div>

      {status === 'connected' ? (
        <TokenVault />
      ) : (
        <div className="tech-card p-10 text-center">
          <div className="flex flex-col items-center justify-center py-10">
            <FaWallet className="text-5xl text-primary mb-4" />
            <h2 className="text-xl font-medium mb-2">
              请连接钱包以访问钱库系统
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg">
              钱库系统需要连接区块链钱包才能进行操作。请点击上方的&quot;连接钱包&quot;按钮来访问完整功能。
            </p>
            <button
              onClick={connect}
              className="py-2 px-6 bg-primary text-white rounded-md flex items-center"
            >
              <FaWallet className="mr-2" />
              连接钱包
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultPage;
