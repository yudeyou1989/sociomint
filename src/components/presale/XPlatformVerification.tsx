'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../../contexts/WalletContext';

// 简化版的图标组件
const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const VerifiedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#4CAF50" stroke="none">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
  </svg>
);

const LoadingIcon = () => (
  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// 社交平台类型
interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  verificationMessage: string;
  isVerified: boolean;
  isVerifying: boolean;
}

// 组件属性类型
interface XPlatformVerificationProps {
  onVerificationSuccess?: () => void;
}

export default function XPlatformVerification({ onVerificationSuccess }: XPlatformVerificationProps) {
  const { t } = useTranslation();
  const { wallet } = useWallet();
  
  // 将钱包转换为我们需要的类型
  const typedWallet = wallet as any;
  const isConnected = typedWallet?.isConnected || false;
  const address = typedWallet?.address || '';
  
  // 社交平台列表
  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <TwitterIcon />,
      verificationMessage: `Verify my wallet address ${address?.slice(0, 8)}... for Sociomint Presale`,
      isVerified: false,
      isVerifying: false
    }
  ]);

  // 当地址变化时更新验证消息
  useEffect(() => {
    if (address) {
      setPlatforms(prev => prev.map(platform => ({
        ...platform,
        verificationMessage: `Verify my wallet address ${address.slice(0, 8)}... for Sociomint Presale`
      })));
    }
  }, [address]);

  // 模拟验证功能
  const handleVerify = async (platformId: string) => {
    if (!isConnected) {
      if (typedWallet?.connect) {
        await typedWallet.connect();
      }
      return;
    }

    try {
      // 更新平台状态为验证中
      setPlatforms(prev => prev.map(p => 
        p.id === platformId 
          ? { ...p, isVerifying: true } 
          : p
      ));

      // 模拟异步验证过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 完成验证，更新状态
      setPlatforms(prev => prev.map(p => 
        p.id === platformId 
          ? { ...p, isVerified: true, isVerifying: false } 
          : p
      ));
      
      // 如果至少有一个平台已验证，调用成功回调
      const anyVerified = platforms.some(p => p.id === platformId || p.isVerified);
      if (anyVerified && onVerificationSuccess) {
        onVerificationSuccess();
      }
      
    } catch (error: any) {
      console.error("Verification error:", error);
      setPlatforms(prev => prev.map(p => 
        p.id === platformId 
          ? { ...p, isVerifying: false } 
          : p
      ));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{t('presale.verification')}</h3>
      <p className="text-sm text-gray-400">
        {t('presale.verificationDesc')}
      </p>

      <div className="divide-y divide-gray-800">
        {platforms.map((platform) => (
          <div key={platform.id} className="py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-primary">{platform.icon}</div>
              <span>{platform.name}</span>
              
              {platform.isVerified && (
                <div className="flex items-center text-green-500">
                  <VerifiedIcon />
                  <span className="ml-1 text-xs">{t('presale.verified')}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleVerify(platform.id)}
              disabled={platform.isVerified || platform.isVerifying}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                platform.isVerified 
                  ? 'bg-green-800/30 text-green-400 cursor-default' 
                  : platform.isVerifying 
                    ? 'bg-gray-800 text-gray-400 cursor-wait' 
                    : 'bg-primary hover:bg-primary/80 text-white'
              }`}
            >
              {platform.isVerifying ? (
                <div className="flex items-center">
                  <LoadingIcon />
                  <span className="ml-2">{t('common.loading')}</span>
                </div>
              ) : platform.isVerified ? (
                t('presale.verified')
              ) : (
                t('presale.verify')
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 