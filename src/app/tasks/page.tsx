'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FaPlus,
  FaFilter,
  FaChevronDown,
  FaCheck,
  FaTwitter,
  FaTelegram,
  FaDiscord,
  FaInstagram,
  FaReddit,
} from 'react-icons/fa';
import TaskCard from '@/components/tasks/TaskCard';
import { useWallet } from '@/contexts/WalletContext';
import { useLanguage } from '@/contexts/LanguageContext';

// 任务类型定义
type TaskAction = 'follow' | 'like' | 'retweet' | 'tweet' | 'comment' | 'join' | 'verify' | 'referral';
type Platform = 'x' | 'telegram' | 'discord' | 'instagram' | 'reddit' | 'all';

// 任务数据接口
interface Task {
  id: number;
  title: string;
  description: string;
  platform: Platform;
  action: TaskAction;
  reward: number;
  completed: number;
  total: number;
  createdAt: Date;
}

// 过滤器
interface TaskFilter {
  platform: Platform | 'all';
  action: TaskAction | 'all';
  sortBy: 'reward' | 'completion' | 'newest' | 'oldest';
}

export default function TasksPage() {
  const { wallet } = useWallet();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'exposure' | 'treasure'>(
    'exposure',
  );
  const [filter, setFilter] = useState<TaskFilter>({
    platform: 'all',
    action: 'all',
    sortBy: 'newest',
  });
  const [showFilters, setShowFilters] = useState(false);

  // 模拟任务数据
  const exposureTasks: Task[] = [
    {
      id: 1,
      title: 'SocioMint 官方推特关注任务',
      description: '关注 SocioMint 官方推特账号完成任务',
      platform: 'x',
      action: 'follow',
      reward: 5,
      completed: 7823,
      total: 10000,
      createdAt: new Date('2025-04-25')
    },
    {
      id: 2,
      title: 'SocioMint 官方推文点赞任务',
      description: '点赞 SocioMint 官方推文完成任务',
      platform: 'x',
      action: 'like',
      reward: 30,
      completed: 85,
      total: 100,
      createdAt: new Date('2025-04-25')
    },
    {
      id: 3,
      title: 'SocioMint 官方推文转发任务',
      description: '转发 SocioMint 官方推文完成任务',
      platform: 'x',
      action: 'retweet',
      reward: 80,
      completed: 42,
      total: 50,
      createdAt: new Date('2025-04-25')
    },
    {
      id: 4,
      title: 'SocioMint 官方电报关注任务',
      description: '关注 SocioMint 官方电报频道完成任务',
      platform: 'telegram',
      action: 'follow',
      reward: 60,
      completed: 18,
      total: 50,
      createdAt: new Date('2025-04-25')
    },
    {
      id: 5,
      title: 'SocioMint Discord评论任务',
      description: '在 SocioMint Discord频道评论完成任务',
      platform: 'discord',
      action: 'comment',
      reward: 100,
      completed: 5,
      total: 20,
      createdAt: new Date('2025-04-25')
    },
  ];

  // X话题宝箱任务
  const treasureTasks: Task[] = [
    {
      id: 101,
      title: '#SocioMint 话题宝箱',
      description: '在推特发布包含 #SocioMint 标签的推文，领取奖励',
      platform: 'x',
      action: 'tweet',
      reward: 10,
      completed: 3240,
      total: 5000,
      createdAt: new Date('2025-04-28')
    },
    {
      id: 102,
      title: 'SocioMint 推文评论任务',
      description: '在 SocioMint 官方推文下发表评论完成任务',
      platform: 'x',
      action: 'comment',
      reward: 200,
      completed: 8,
      total: 25,
      createdAt: new Date('2025-04-25')
    },
    {
      id: 103,
      title: 'SocioMint 推文点赞任务',
      description: '点赞 SocioMint 官方推文完成任务',
      platform: 'x',
      action: 'like',
      reward: 120,
      completed: 40,
      total: 50,
      createdAt: new Date('2025-04-25')
    },
  ];

  // 应用过滤器
  const getFilteredTasks = () => {
    const tasks = activeTab === 'exposure' ? exposureTasks : treasureTasks;

    return tasks
      .filter((task) => {
        if (filter.platform !== 'all' && task.platform !== filter.platform)
          return false;
        if (filter.action !== 'all' && task.action !== filter.action)
          return false;
        return true;
      })
      .sort((a, b) => {
        if (filter.sortBy === 'reward') {
          return b.reward - a.reward; // 奖励从高到低
        } else if (filter.sortBy === 'completion') {
          // 完成率从低到高
          return a.completed / a.total - b.completed / b.total;
        } else if (filter.sortBy === 'newest') {
          return b.createdAt.getTime() - a.createdAt.getTime();
        } else if (filter.sortBy === 'oldest') {
          return a.createdAt.getTime() - b.createdAt.getTime();
        }
        return 0;
      });
  };

  // 平台图标
  const platformIcons = {
    x: <FaTwitter className="w-4 h-4" />,
    telegram: <FaTelegram className="w-4 h-4" />,
    discord: <FaDiscord className="w-4 h-4" />,
    instagram: <FaInstagram className="w-4 h-4" />,
    reddit: <FaReddit className="w-4 h-4" />,
  };

  // 平台选择
  const PlatformFilter = () => (
    <div className="space-y-2">
      <h3 className="text-sm font-medium mb-2">{t('tasks.filters.platform')}</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter({ ...filter, platform: 'all' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.platform === 'all' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.platformOptions.all')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, platform: 'x' })}
          className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${filter.platform === 'x' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-300'}`}
        >
          {platformIcons.x} {t('tasks.filters.platformOptions.x')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, platform: 'telegram' })}
          className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${filter.platform === 'telegram' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-300'}`}
        >
          {platformIcons.telegram} {t('tasks.filters.platformOptions.telegram')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, platform: 'discord' })}
          className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${filter.platform === 'discord' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-300'}`}
        >
          {platformIcons.discord} {t('tasks.filters.platformOptions.discord')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, platform: 'instagram' })}
          className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${filter.platform === 'instagram' ? 'bg-pink-500/20 text-pink-400' : 'bg-gray-800 text-gray-300'}`}
        >
          {platformIcons.instagram} {t('tasks.filters.platformOptions.instagram')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, platform: 'reddit' })}
          className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${filter.platform === 'reddit' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-300'}`}
        >
          {platformIcons.reddit} {t('tasks.filters.platformOptions.reddit')}
        </button>
      </div>
    </div>
  );

  // 动作选择
  const ActionFilter = () => (
    <div className="space-y-2">
      <h3 className="text-sm font-medium mb-2">{t('tasks.filters.action')}</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter({ ...filter, action: 'all' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.action === 'all' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.actionOptions.all')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, action: 'follow' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.action === 'follow' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.actionOptions.follow')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, action: 'like' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.action === 'like' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.actionOptions.like')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, action: 'retweet' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.action === 'retweet' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.actionOptions.retweet')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, action: 'tweet' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.action === 'tweet' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.actionOptions.tweet')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, action: 'join' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.action === 'join' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.actionOptions.join')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, action: 'verify' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.action === 'verify' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.actionOptions.verify')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, action: 'comment' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.action === 'comment' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.actionOptions.comment')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, action: 'referral' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.action === 'referral' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.actionOptions.referral')}
        </button>
      </div>
    </div>
  );

  // 排序选择
  const SortFilter = () => (
    <div className="space-y-2">
      <h3 className="text-sm font-medium mb-2">{t('tasks.filters.sortBy')}</h3>
      <div className="flex gap-2">
        <button
          onClick={() => setFilter({ ...filter, sortBy: 'reward' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.sortBy === 'reward' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.sortOptions.rewardHighest')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, sortBy: 'completion' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.sortBy === 'completion' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.sortOptions.rewardLowest')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, sortBy: 'newest' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.sortBy === 'newest' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.sortOptions.newest')}
        </button>
        <button
          onClick={() => setFilter({ ...filter, sortBy: 'oldest' })}
          className={`px-3 py-1.5 rounded-md text-xs ${filter.sortBy === 'oldest' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-300'}`}
        >
          {t('tasks.filters.sortOptions.oldest')}
        </button>
      </div>
    </div>
  );

  const filteredTasks = getFilteredTasks();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t('tasks.title')}</h1>
        <div className="flex gap-2 mt-4 md:mt-0">
          {wallet.isConnected ? (
            <Link href="/tasks/create">
              <button className="neon-button py-2 px-4 rounded-md flex items-center gap-2">
                <FaPlus className="w-4 h-4" />
                <span>{t('tasks.createTask')}</span>
              </button>
            </Link>
          ) : (
            <button
              className="py-2 px-4 rounded-md flex items-center gap-2 bg-gray-800 text-gray-400 cursor-not-allowed"
              title={t('tasks.connectWallet')}
              disabled
            >
              <FaPlus className="w-4 h-4" />
              <span>{t('tasks.createTask')}</span>
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-md flex items-center gap-2 transition-colors"
          >
            <FaFilter className="w-4 h-4" />
            <span>{t('tasks.filters')}</span>
            <FaChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('exposure')}
            className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'exposure' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'}`}
          >
            {t('tasks.tabs.exposure')}
          </button>
          <button
            onClick={() => setActiveTab('treasure')}
            className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'treasure' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'}`}
          >
            {t('tasks.tabs.treasure')}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 glass-card p-4 space-y-4">
          <PlatformFilter />
          <ActionFilter />
          <SortFilter />
        </div>
      )}

      {!wallet.isConnected && (
        <div className="glass-card p-5 mb-6 border-yellow-500/30 border">
          <div className="flex items-center text-yellow-400 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="font-semibold">{t('tasks.connectWallet')}</p>
          </div>
          <p className="text-gray-300 text-sm ml-7">
            {t('tasks.connectWalletDescription')}
          </p>
        </div>
      )}

      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`${!wallet.isConnected ? 'opacity-70' : ''} relative`}
            >
              <TaskCard
                id={task.id}
                platform={task.platform}
                action={task.action}
                reward={task.reward}
                completed={task.completed}
                total={task.total}
              />
              {!wallet.isConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-sm z-10">
                  <div className="bg-gray-900/70 px-4 py-3 rounded-lg border border-primary/30 backdrop-blur-md">
                    <p className="text-white text-center">{t('tasks.connectWallet')}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-gray-400">
          <p>{t('tasks.noTasksFound')}</p>
        </div>
      )}
    </div>
  );
}
