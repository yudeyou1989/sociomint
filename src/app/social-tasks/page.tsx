'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFlower, FaUsers, FaTasks, FaGift } from 'react-icons/fa';
import { BsFlower1 } from 'react-icons/bs';
import dynamic from 'next/dynamic';

// 动态导入组件，避免SSR问题
const SocialTaskList = dynamic(() => import('@/components/social/SocialTaskList'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-64"></div>
});

const ReferralSystem = dynamic(() => import('@/components/social/ReferralSystem'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-64"></div>
});

const WeeklyRewardStatus = dynamic(() => import('@/components/social/WeeklyRewardStatus'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-64"></div>
});

export default function SocialTasksPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('tasks');

  // 从URL参数获取tab
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && activeTab !== tabParam) {
      setActiveTab(tabParam);
    }
  }

  const tabs = [
    { id: 'tasks', name: t('socialTasks.tabs.tasks'), icon: "📋" },
    { id: 'referrals', name: t('socialTasks.tabs.referrals'), icon: "👤" },
    { id: 'rewards', name: t('socialTasks.tabs.rewards'), icon: "🎁" },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <BsFlower1 className="text-4xl text-[#0de5ff] mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0de5ff] to-[#8b3dff] text-transparent bg-clip-text">
            {t('socialTasks.title')}
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          {t('socialTasks.subtitle')}
        </p>
      </div>

      {/* 标签页导航 */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-800/50 rounded-lg p-1 flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#0de5ff] to-[#8b3dff] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.icon}
              <span className="ml-2">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 标签页内容 */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'tasks' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              📋
              {t('socialTasks.sections.availableTasks')}
            </h2>
            <SocialTaskList />
          </div>
        )}

        {activeTab === 'referrals' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              👤
              {t('socialTasks.sections.referralSystem')}
            </h2>
            <ReferralSystem />
          </div>
        )}

        {activeTab === 'rewards' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              🎁
              {t('socialTasks.sections.weeklyRewards')}
            </h2>
            <WeeklyRewardStatus />
          </div>
        )}
      </div>

      {/* 小红花说明 */}
      <div className="mt-16 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-8 border border-gray-700">
          <div className="flex items-center mb-4">
            <BsFlower1 className="text-3xl text-[#0de5ff] mr-3" />
            <h3 className="text-2xl font-bold">{t('socialTasks.redFlower.title')}</h3>
          </div>
          <p className="text-gray-300 mb-4">
            {t('socialTasks.redFlower.description')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800/30 rounded-lg">
              📋
              <h4 className="font-semibold mb-1">{t('socialTasks.redFlower.earn.title')}</h4>
              <p className="text-sm text-gray-400">{t('socialTasks.redFlower.earn.description')}</p>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-lg">
              👤
              <h4 className="font-semibold mb-1">{t('socialTasks.redFlower.share.title')}</h4>
              <p className="text-sm text-gray-400">{t('socialTasks.redFlower.share.description')}</p>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-lg">
              🎁
              <h4 className="font-semibold mb-1">{t('socialTasks.redFlower.exchange.title')}</h4>
              <p className="text-sm text-gray-400">{t('socialTasks.redFlower.exchange.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
