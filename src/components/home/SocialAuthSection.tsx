'use client';

import { useState } from 'react';
import {
  FaTwitter,
  FaTelegram,
  FaDiscord,
  FaCheck,
  FaSpinner,
} from 'react-icons/fa';
import { useWallet } from '@/contexts/WalletContext';

// 定义社交平台类型
type SocialPlatform = 'x' | 'telegram' | 'discord';

// 社交平台认证状态
interface AuthStatus {
  x: 'pending' | 'completed' | 'not_started';
  telegram: 'pending' | 'completed' | 'not_started';
  discord: 'pending' | 'completed' | 'not_started';
}

export default function SocialAuthSection() {
  const { wallet, updateBalances } = useWallet();

  // 认证状态
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    x: 'not_started',
    telegram: 'not_started',
    discord: 'not_started',
  });

  // 认证平台配置
  const platforms = [
    {
      id: 'x' as SocialPlatform,
      name: 'X (Twitter)',
      icon: <FaTwitter className="w-8 h-8 text-blue-400" />,
      reward: 200,
      description: '连接并认证您的X (Twitter)账号，获得200小红花奖励',
    },
    {
      id: 'telegram' as SocialPlatform,
      name: 'Telegram',
      icon: <FaTelegram className="w-8 h-8 text-cyan-400" />,
      reward: 150,
      description: '连接并认证您的Telegram账号，获得150小红花奖励',
    },
    {
      id: 'discord' as SocialPlatform,
      name: 'Discord',
      icon: <FaDiscord className="w-8 h-8 text-purple-400" />,
      reward: 180,
      description: '连接并认证您的Discord账号，获得180小红花奖励',
    },
  ];

  // 开始认证流程
  const startAuth = async (platform: SocialPlatform) => {
    if (!wallet.isConnected) {
      alert('请先连接钱包');
      return;
    }

    // 更新状态为pending
    setAuthStatus((prev) => ({
      ...prev,
      [platform]: 'pending',
    }));

    try {
      // 在实际应用中，这里应该重定向到平台认证页面或打开认证弹窗
      // 为演示，我们使用setTimeout模拟异步认证流程
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 模拟认证成功
      setAuthStatus((prev) => ({
        ...prev,
        [platform]: 'completed',
      }));

      // 获取平台奖励数量
      const reward = platforms.find((p) => p.id === platform)?.reward || 0;

      // 更新小红花余额
      updateBalances({
        redFlower: (wallet.balance.redFlower || 0) + reward,
      });

      // 显示成功消息
      alert(`恭喜！成功认证${platform}平台，获得${reward}小红花奖励！`);
    } catch (error) {
      console.error('认证失败:', error);
      setAuthStatus((prev) => ({
        ...prev,
        [platform]: 'not_started',
      }));
      alert('认证失败，请稍后重试');
    }
  };

  // 根据认证状态返回按钮文本和样式
  const getAuthButton = (platform: SocialPlatform) => {
    const status = authStatus[platform];

    if (status === 'completed') {
      return (
        <button
          className="flex items-center justify-center gap-2 py-2 px-4 bg-green-600/30 text-green-400 rounded-md cursor-default border border-green-600/50"
          disabled
        >
          <FaCheck className="w-4 h-4" />
          已认证
        </button>
      );
    }

    if (status === 'pending') {
      return (
        <button
          className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-700 text-gray-300 rounded-md cursor-wait"
          disabled
        >
          <FaSpinner className="w-4 h-4 animate-spin" />
          认证中...
        </button>
      );
    }

    return (
      <button
        onClick={() => startAuth(platform)}
        className="neon-button py-2 px-4 rounded-md"
      >
        去认证
      </button>
    );
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold mb-6">社交平台认证</h2>
      <p className="text-gray-400 mb-6">
        认证您的社交媒体账号，获取小红花奖励。每个平台仅能认证一次。
      </p>

      <div className="space-y-6">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-black/30 rounded-lg border border-gray-800 gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-black/50 border border-gray-700">
                {platform.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{platform.name}</h3>
                <p className="text-gray-400 text-sm">{platform.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 ml-0 sm:ml-4">
              <div className="text-primary font-semibold">
                +{platform.reward}{' '}
                <span className="text-sm text-gray-400">小红花</span>
              </div>
              {getAuthButton(platform.id)}
            </div>
          </div>
        ))}
      </div>

      {!wallet.isConnected && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-yellow-400">
          <p>请先连接钱包以进行社交平台认证</p>
        </div>
      )}
    </div>
  );
}
