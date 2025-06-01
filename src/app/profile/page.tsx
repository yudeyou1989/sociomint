'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  FaUser,
  FaWallet,
  FaTwitter,
  FaTelegram,
  FaDiscord,
  FaCopy,
  FaExternalLinkAlt,
  FaKey,
} from 'react-icons/fa';
import { getNetworkInfo } from '@/services/walletService';
import NetworkSwitcher from '@/components/wallet/NetworkSwitcher';
import { toast } from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';

// 用户等级类型
interface UserLevel {
  level: number;
  title: string;
}

// 社交平台绑定类型
interface SocialBinding {
  platform: string;
  username: string | null;
  isBound: boolean;
}

// 组件属性接口定义
interface UserBasicInfoProps {
  isLoadingUserInfo: boolean;
  username: string | null;
  userLevel: UserLevel | null;
  registerDate: string | null;
  completedTasks: number | null;
  totalRewards: number | null;
}

interface AccountSecurityProps {
  isLoadingSecurity: boolean;
  isPhoneVerified: boolean | null;
  isEmailVerified: boolean | null;
  isTwoFactorEnabled: boolean | null;
  lastLoginTime: string | null;
}

interface SocialBindingsProps {
  isLoadingBindings: boolean;
  socialBindings: SocialBinding[];
  handleBindPlatform: (platform: string) => void;
}

// 组件分离: 基本信息组件
const UserBasicInfo = React.memo(({ 
  isLoadingUserInfo, 
  username, 
  userLevel, 
  registerDate, 
  completedTasks, 
  totalRewards 
}: UserBasicInfoProps) => {
  const { t } = useLanguage();
  
  // 渲染加载状态
  const renderLoading = () => (
    <div className="animate-pulse h-4 bg-gray-700 rounded w-24"></div>
  );
  
  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold mb-4">{t('profile.basicInfo')}</h2>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div className="text-gray-400">{t('profile.username')}</div>
          <div className="flex-grow text-right">
            {isLoadingUserInfo ? renderLoading() : username}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div className="text-gray-400">{t('profile.userLevel')}</div>
          <div className="flex-grow text-right">
            {isLoadingUserInfo
              ? renderLoading()
              : userLevel && (
                  <span className="bg-primary/20 text-primary rounded-full px-3 py-0.5">
                    Lv.{userLevel.level} {userLevel.title}
                  </span>
                )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div className="text-gray-400">{t('profile.registerDate')}</div>
          <div className="flex-grow text-right">
            {isLoadingUserInfo ? renderLoading() : registerDate}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div className="text-gray-400">{t('profile.completedTasks')}</div>
          <div className="flex-grow text-right">
            {isLoadingUserInfo ? renderLoading() : completedTasks}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div className="text-gray-400">{t('profile.totalRewards')}</div>
          <div className="flex-grow text-right">
            {isLoadingUserInfo
              ? renderLoading()
              : totalRewards && (
                  <span className="text-amber-500">{totalRewards}</span>
                )}
          </div>
        </div>
      </div>
    </div>
  );
});

// 组件分离: 账户安全组件
const AccountSecurity = React.memo(({ 
  isLoadingSecurity, 
  isPhoneVerified, 
  isEmailVerified, 
  isTwoFactorEnabled, 
  lastLoginTime 
}: AccountSecurityProps) => {
  const { t } = useLanguage();
  
  // 渲染加载状态
  const renderLoading = () => (
    <div className="animate-pulse h-4 bg-gray-700 rounded w-24"></div>
  );
  
  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold mb-4">{t('profile.accountSecurity')}</h2>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div className="text-gray-400">{t('profile.phoneVerification')}</div>
          <div className="flex-grow text-right">
            {isLoadingSecurity ? (
              renderLoading()
            ) : (
              <span
                className={
                  isPhoneVerified ? 'text-green-500' : 'text-yellow-500'
                }
              >
                {isPhoneVerified ? t('profile.verified') : t('profile.notVerified')}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div className="text-gray-400">{t('profile.emailVerification')}</div>
          <div className="flex-grow text-right">
            {isLoadingSecurity ? (
              renderLoading()
            ) : (
              <span
                className={
                  isEmailVerified ? 'text-green-500' : 'text-yellow-500'
                }
              >
                {isEmailVerified ? t('profile.verified') : t('profile.notVerified')}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div className="text-gray-400">{t('profile.twoFactorAuth')}</div>
          <div className="flex-grow text-right">
            {isLoadingSecurity ? (
              renderLoading()
            ) : (
              <span
                className={
                  isTwoFactorEnabled ? 'text-green-500' : 'text-yellow-500'
                }
              >
                {isTwoFactorEnabled ? t('profile.enabled') : t('profile.notEnabled')}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div className="text-gray-400">{t('profile.lastLogin')}</div>
          <div className="flex-grow text-right">
            {isLoadingSecurity ? renderLoading() : lastLoginTime}
          </div>
        </div>
      </div>
    </div>
  );
});

// 组件分离: 社交绑定组件
const SocialBindings = React.memo(({ 
  isLoadingBindings, 
  socialBindings,
  handleBindPlatform 
}: SocialBindingsProps) => {
  const { t } = useLanguage();
  
  // 渲染加载状态
  const renderLoading = () => (
    <div className="animate-pulse h-4 bg-gray-700 rounded w-24"></div>
  );
  
  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold mb-4">{t('profile.socialBindings')}</h2>
      <div className="space-y-4">
        {isLoadingBindings ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row md:items-center gap-2 justify-between"
              >
                {renderLoading()}
              </div>
            ))}
          </div>
        ) : (
          socialBindings.map((binding: SocialBinding) => (
            <div
              key={binding.platform}
              className="flex flex-col md:flex-row md:items-center gap-2 justify-between"
            >
              <div className="text-gray-400 flex items-center">
                {binding.platform === 'twitter' && (
                  <FaTwitter className="mr-2 text-blue-400" />
                )}
                {binding.platform === 'telegram' && (
                  <FaTelegram className="mr-2 text-blue-500" />
                )}
                {binding.platform === 'discord' && (
                  <FaDiscord className="mr-2 text-indigo-400" />
                )}
                {binding.platform.charAt(0).toUpperCase() +
                  binding.platform.slice(1)}
              </div>
              <div className="flex-grow text-right">
                {binding.isBound ? (
                  <div className="flex items-center justify-end">
                    <span className="text-green-500 mr-2">
                      {binding.username}
                    </span>
                    <button className="text-red-500 hover:text-red-400 text-sm">
                      {t('profile.unbind')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleBindPlatform(binding.platform)}
                    className="text-primary hover:text-primary/80"
                  >
                    {t('profile.bind')}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

// 主页面组件
export default function ProfilePage() {
  const {
    wallet,
    connect: connectWallet,
    disconnect: disconnectWallet,
    updateBalances
  } = useWallet();
  const { t } = useLanguage();
  
  // 余额辅助变量
  const balance = wallet?.balance || { bnb: 0, sm: 0 };
  
  // 可用钱包列表（模拟数据）
  const availableWallets = [
    { id: 'metamask', name: 'MetaMask', icon: '/images/wallets/metamask.svg' },
    { id: 'walletconnect', name: 'WalletConnect', icon: '/images/wallets/walletconnect.svg' }
  ];
  
  // 上次连接时间（模拟数据）
  const lastConnectedTime = wallet?.isConnected ? new Date().toISOString() : null;
  
  const [activeTab, setActiveTab] = useState<
    'account' | 'wallet' | 'platforms'
  >('account');
  const [explorerUrl, setExplorerUrl] = useState<string>('');

  // 基本信息状态
  const [username, setUsername] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [registerDate, setRegisterDate] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number | null>(null);
  const [totalRewards, setTotalRewards] = useState<number | null>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState<boolean>(true);

  // 账户安全状态
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState<boolean | null>(
    null,
  );
  const [lastLoginTime, setLastLoginTime] = useState<string | null>(null);
  const [isLoadingSecurity, setIsLoadingSecurity] = useState<boolean>(true);

  // 权限管理状态
  const [isLoadingAuthorizations, setIsLoadingAuthorizations] =
    useState<boolean>(true);

  // 社交平台绑定状态
  const [socialBindings, setSocialBindings] = useState<SocialBinding[]>([]);
  const [isLoadingBindings, setIsLoadingBindings] = useState<boolean>(true);

  // 绑定设置状态
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean | null>(null);
  const [taskNotificationsEnabled, setTaskNotificationsEnabled] = useState<
    boolean | null
  >(null);
  const [privacyModeEnabled, setPrivacyModeEnabled] = useState<boolean | null>(
    null,
  );
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);

  // 优化: 使用useCallback减少函数重新创建
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoadingUserInfo(true);
      // 实际应用中这将是API调用
      // 模拟API调用
      const data = {
        username: 'SocioMint用户',
        userLevel: { level: 3, title: '探索者' },
        registerDate: '2025-01-15',
        completedTasks: 42,
        totalRewards: 25840
      };
      
      // 更新状态
      setUsername(data.username);
      setUserLevel(data.userLevel);
      setRegisterDate(data.registerDate);
      setCompletedTasks(data.completedTasks);
      setTotalRewards(data.totalRewards);
    } catch (error) {
      console.error('获取用户数据失败:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoadingUserInfo(false);
    }
  }, [t]);

  const fetchSecurityData = useCallback(async () => {
    try {
      setIsLoadingSecurity(true);
      // 实际应用中这将是API调用
      // 模拟API调用
      const data = {
        isPhoneVerified: true,
        isEmailVerified: false,
        isTwoFactorEnabled: false,
        lastLoginTime: '2025-04-22 10:25'
      };
      
      // 更新状态
      setIsPhoneVerified(data.isPhoneVerified);
      setIsEmailVerified(data.isEmailVerified);
      setIsTwoFactorEnabled(data.isTwoFactorEnabled);
      setLastLoginTime(data.lastLoginTime);
    } catch (error) {
      console.error('获取安全数据失败:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoadingSecurity(false);
    }
  }, [t]);

  const fetchSocialBindings = useCallback(async () => {
    try {
      setIsLoadingBindings(true);
      // 实际应用中这将是API调用
      // 模拟API调用
      const data = [
        { platform: 'twitter', username: '@SocioMint_User', isBound: true },
        { platform: 'telegram', username: null, isBound: false },
        { platform: 'discord', username: 'SocioUser#1234', isBound: true },
      ];
      
      setSocialBindings(data);
    } catch (error) {
      console.error('获取社交绑定数据失败:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoadingBindings(false);
    }
  }, [t]);

  const fetchSettingsData = useCallback(async () => {
    try {
      setIsLoadingSettings(true);
      // 实际应用中这将是API调用
      // 模拟API调用
      const data = {
        autoSyncEnabled: true,
        taskNotificationsEnabled: false,
        privacyModeEnabled: true
      };
      
      setAutoSyncEnabled(data.autoSyncEnabled);
      setTaskNotificationsEnabled(data.taskNotificationsEnabled);
      setPrivacyModeEnabled(data.privacyModeEnabled);
    } catch (error) {
      console.error('获取设置数据失败:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoadingSettings(false);
    }
  }, [t]);
  
  // 获取用户数据 - 使用独立的函数避免内联函数造成的重复渲染
  useEffect(() => {
    fetchUserData();
    fetchSecurityData();
  }, [fetchUserData, fetchSecurityData]);

  // 获取权限信息
  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      setIsLoadingAuthorizations(true);
      
      // 实际应用中这将是与区块链交互的调用
      // 模拟调用
      const timer = setTimeout(() => {
        setIsLoadingAuthorizations(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [wallet.isConnected, wallet.address]);

  // 获取社交平台绑定信息
  useEffect(() => {
    fetchSocialBindings();
    fetchSettingsData();
  }, [fetchSocialBindings, fetchSettingsData]);

  // 更新区块浏览器URL - 使用useMemo优化计算
  useEffect(() => {
    if (wallet.isConnected && wallet.network?.id) {
      const network = getNetworkInfo(wallet.chainId || 0);
      if (network) {
        setExplorerUrl(`${network.blockExplorerUrl}/address/${wallet.address}`);
      } else {
        setExplorerUrl('');
      }
    } else {
      setExplorerUrl('');
    }
  }, [wallet.isConnected, wallet.network?.id, wallet.address]);

  // 优化: 使用useCallback减少函数重新创建
  const copyAddress = useCallback(() => {
    if (!wallet.address) return;

    navigator.clipboard
      .writeText(wallet.address)
      .then(() => {
        toast.success(t('profile.addressCopied'));
      })
      .catch(() => {
        toast.error(t('common.error'));
      });
  }, [wallet.address, t]);

  // 连接MetaMask钱包
  const handleConnectMetaMask = useCallback(async () => {
    try {
      // 在新的 walletService API 中，connectWallet 不需要参数
      await connectWallet();
    } catch (error) {
      console.error('连接钱包失败:', error);
    }
  }, [connectWallet]);

  // 社交平台绑定处理函数
  const handleBindPlatform = useCallback((platform: string) => {
    toast.success(t('profile.bindingProcess', { platform }));
    // 实际应用中会打开OAuth或其他绑定流程
  }, [t]);

  // 格式化日期
  const formatDateTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // 渲染加载状态
  const renderLoading = () => (
    <div className="animate-pulse h-4 bg-gray-700 rounded w-24"></div>
  );

  // 记忆账户数据选项卡内容，避免重新渲染
  const accountTabContent = useMemo(() => (
    <div className="space-y-6">
      <UserBasicInfo 
        isLoadingUserInfo={isLoadingUserInfo}
        username={username}
        userLevel={userLevel}
        registerDate={registerDate}
        completedTasks={completedTasks}
        totalRewards={totalRewards}
      />
      
      <AccountSecurity 
        isLoadingSecurity={isLoadingSecurity}
        isPhoneVerified={isPhoneVerified}
        isEmailVerified={isEmailVerified}
        isTwoFactorEnabled={isTwoFactorEnabled}
        lastLoginTime={lastLoginTime}
      />
      
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4">{t('profile.bindingSettings')}</h2>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
            <div className="text-gray-400">{t('profile.autoSync')}</div>
            <div className="flex-grow text-right">
              {isLoadingSettings ? (
                renderLoading()
              ) : (
                <div className="inline-flex items-center">
                  <input
                    type="checkbox"
                    id="autoSync"
                    checked={autoSyncEnabled || false}
                    onChange={() => setAutoSyncEnabled(!autoSyncEnabled)}
                    className="form-checkbox h-5 w-5 text-primary"
                  />
                  <label htmlFor="autoSync" className="ml-2">
                    {autoSyncEnabled ? t('common.enabled') : t('common.disabled')}
                  </label>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
            <div className="text-gray-400">{t('profile.taskNotifications')}</div>
            <div className="flex-grow text-right">
              {isLoadingSettings ? (
                renderLoading()
              ) : (
                <div className="inline-flex items-center">
                  <input
                    type="checkbox"
                    id="taskNotifications"
                    checked={taskNotificationsEnabled || false}
                    onChange={() =>
                      setTaskNotificationsEnabled(!taskNotificationsEnabled)
                    }
                    className="form-checkbox h-5 w-5 text-primary"
                  />
                  <label htmlFor="taskNotifications" className="ml-2">
                    {taskNotificationsEnabled ? t('common.enabled') : t('common.disabled')}
                  </label>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
            <div className="text-gray-400">{t('profile.privacyMode')}</div>
            <div className="flex-grow text-right">
              {isLoadingSettings ? (
                renderLoading()
              ) : (
                <div className="inline-flex items-center">
                  <input
                    type="checkbox"
                    id="privacyMode"
                    checked={privacyModeEnabled || false}
                    onChange={() => setPrivacyModeEnabled(!privacyModeEnabled)}
                    className="form-checkbox h-5 w-5 text-primary"
                  />
                  <label htmlFor="privacyMode" className="ml-2">
                    {privacyModeEnabled ? t('common.enabled') : t('common.disabled')}
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [
    isLoadingUserInfo, username, userLevel, registerDate, completedTasks, totalRewards,
    isLoadingSecurity, isPhoneVerified, isEmailVerified, isTwoFactorEnabled, lastLoginTime,
    isLoadingSettings, autoSyncEnabled, taskNotificationsEnabled, privacyModeEnabled, t
  ]);

  // 记忆钱包管理选项卡内容，避免重新渲染
  const walletTabContent = useMemo(() => (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4">{t('profile.walletManagement')}</h2>

        {wallet.isConnected ? (
          <>
            <div className="mb-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between mb-4">
                <div className="text-gray-400">{t('profile.currentWallet')}</div>
                <div className="flex-grow flex gap-2 justify-end items-center">
                  <FaWallet className="text-primary" />
                  <span className="font-medium">{getNetworkInfo(wallet.network?.id || 1)?.name || t('profile.unknownWallet')}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between mb-4">
                <div className="text-gray-400">{t('profile.walletAddress')}</div>
                <div className="flex-grow flex gap-2 justify-end items-center break-all">
                  <span className="text-right">
                    {wallet.address ? (
                      <>
                        <span className="font-mono text-sm md:text-base">
                          {wallet.address.substring(0, 6)}...
                          {wallet.address.substring(wallet.address.length - 4)}
                        </span>
                        <button
                          onClick={copyAddress}
                          className="ml-2 text-primary hover:text-primary/80"
                          title={t('profile.copyAddress')}
                        >
                          <FaCopy />
                        </button>
                        {explorerUrl && (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-primary hover:text-primary/80"
                            title={t('profile.viewOnExplorer')}
                          >
                            <FaExternalLinkAlt />
                          </a>
                        )}
                      </>
                    ) : (
                      t('profile.walletNotConnected')
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between mb-4">
                <div className="text-gray-400">{t('profile.connectionTime')}</div>
                <div className="flex-grow text-right">
                  {lastConnectedTime
                    ? formatDateTime(Date.parse(lastConnectedTime))
                    : t('profile.unknown')}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between mb-4">
                <div className="text-gray-400">{t('profile.currentNetwork')}</div>
                <div className="flex-grow text-right">
                  <NetworkSwitcher />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
                <div className="text-gray-400">{t('profile.accountBalance')}</div>
                <div className="flex-grow text-right font-medium text-amber-500">
                  {balance.bnb} {wallet.network?.id === 56 || wallet.network?.id === 97 ? 'BNB' : 'ETH'}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={disconnectWallet}
                className="btn-outline-danger"
              >
                {t('profile.disconnectWallet')}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <FaWallet className="text-4xl text-gray-500 mb-4" />
            <p className="text-center text-gray-400 mb-6">
              {t('profile.noWalletConnected')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {availableWallets.map((walletItem) => (
                <button
                  key={walletItem.id}
                  onClick={handleConnectMetaMask}
                  className="btn-primary"
                >
                  {t('profile.connectMetaMask')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {wallet.isConnected && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">
            <div className="flex items-center">
              <FaKey className="mr-2 text-primary" />
              {t('profile.contractAuthorization')}
            </div>
          </h2>

          {isLoadingAuthorizations ? (
            <div className="py-8 flex justify-center">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="py-4 text-center text-gray-400">
              <p>{t('profile.noAuthData')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  ), [
    wallet.isConnected, wallet.address, wallet.chainId,
    explorerUrl, lastConnectedTime, balance.bnb,
    availableWallets, isLoadingAuthorizations,
    copyAddress, disconnectWallet, handleConnectMetaMask, formatDateTime, t
  ]);

  // 记忆平台连接选项卡内容，避免重新渲染
  const platformsTabContent = useMemo(() => (
    <div className="space-y-6">
      <SocialBindings 
        isLoadingBindings={isLoadingBindings}
        socialBindings={socialBindings}
        handleBindPlatform={handleBindPlatform}
      />
    </div>
  ), [isLoadingBindings, socialBindings, handleBindPlatform]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <FaUser className="mr-3 text-primary" />
          {t('profile.title')}
        </h1>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'account' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {t('profile.accountInfo')}
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'wallet' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {t('profile.walletManagement')}
          </button>
          <button
            onClick={() => setActiveTab('platforms')}
            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'platforms' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {t('profile.platformConnections')}
          </button>
        </div>
      </div>

      {/* 根据选中的标签页显示对应内容 */}
      {activeTab === 'account' && accountTabContent}
      {activeTab === 'wallet' && walletTabContent}
      {activeTab === 'platforms' && platformsTabContent}
    </div>
  );
}
