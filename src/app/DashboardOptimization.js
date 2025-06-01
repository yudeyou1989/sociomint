'use client';

import React, { Suspense, lazy, useCallback, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@supabase/supabase-js';

// 使用 dynamic import 替代 React.lazy，更适合 Next.js
const TreasureBoxStats = dynamic(() => import('@/components/TreasureBoxStats'), {
  loading: () => <div className="w-full h-40 flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
  </div>,
  ssr: false // 避免 SSR 相关问题
});

const TaskList = dynamic(() => import('@/components/TaskList'), {
  loading: () => <div className="w-full h-40 flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
  </div>,
  ssr: false
});

const UserProfile = dynamic(() => import('@/components/UserProfile'), {
  ssr: true // 用户资料可以 SSR 渲染
});

// 创建一个独立的 supabase 客户端，避免重复导入
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 高效的数据缓存管理，添加LRU缓存策略
class LRUCache {
  constructor(limit = 50) {
    this.limit = limit;
    this.cache = new Map();
    this.timestamps = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    // 更新访问时间戳
    this.timestamps.set(key, Date.now());
    return this.cache.get(key);
  }

  set(key, value, ttl = 5 * 60 * 1000) {
    // 如果超出限制，删除最早访问的项
    if (this.cache.size >= this.limit) {
      const oldest = [...this.timestamps.entries()]
        .sort((a, b) => a[1] - b[1])[0][0];
      this.cache.delete(oldest);
      this.timestamps.delete(oldest);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
    this.timestamps.set(key, Date.now());
    
    // 设置定时器自动清理过期缓存
    setTimeout(() => {
      if (this.cache.has(key)) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }, ttl);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }
}

// 全局 LRU 缓存实例
const globalCache = new LRUCache();

// 使用 Web Worker 进行数据处理
const useDataProcessing = (data, processor) => {
  const [result, setResult] = useState(null);
  
  useEffect(() => {
    if (!data) return;
    
    // 检查是否支持 Web Worker
    if (typeof Worker !== 'undefined') {
      // 创建内联 Worker
      const code = `
        self.onmessage = function(e) {
          const result = (${processor.toString()})(e.data);
          self.postMessage(result);
        }
      `;
      
      const blob = new Blob([code], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      worker.onmessage = (e) => {
        setResult(e.data);
        worker.terminate();
      };
      
      worker.postMessage(data);
      
      return () => worker.terminate();
    } else {
      // 如果不支持 Worker，直接处理
      setResult(processor(data));
    }
  }, [data, processor]);
  
  return result;
};

const DashboardOptimization = () => {
  const { t } = useLanguage();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [user, setUser] = useState(null);
  
  // 在组件加载时获取用户信息
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    
    getUser();
  }, []);
  
  // 使用记忆化函数减少重新渲染
  const fetchActivities = useCallback(async () => {
    if (!user) return;
    
    const cacheKey = `user_activities_${user.id}`;
    const cachedData = globalCache.get(cacheKey);
    
    if (cachedData && !cachedData.expires < Date.now()) {
      setActivities(cachedData.value);
      return;
    }
    
    setLoading(true);
    try {
      // 使用 Promise.all 并行请求减少等待时间
      const [boxesResult, tasksResult] = await Promise.all([
        supabase
          .from('treasure_boxes')
          .select('id, name, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
          
        supabase
          .from('task_submissions')
          .select('id, created_at, status, task:task_id(title)')
          .eq('submitter_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);
      
      const boxes = boxesResult.data || [];
      const tasks = tasksResult.data || [];
      
      // 处理和合并活动数据
      const processActivities = (data) => {
        const [boxes, tasks] = data;
        return [
          ...boxes.map(box => ({
            id: `box_${box.id}`,
            type: 'box',
            title: box.name,
            date: new Date(box.created_at),
            status: box.status,
            data: box
          })),
          ...tasks.map(task => ({
            id: `task_${task.id}`,
            type: 'task',
            title: task.task?.title || t('tasks.untitledTask'),
            date: new Date(task.created_at),
            status: task.status,
            data: task
          }))
        ].sort((a, b) => b.date - a.date);
      };
      
      // 使用 Web Worker 处理数据
      const allActivities = useDataProcessing([boxes, tasks], processActivities) || 
        processActivities([boxes, tasks]);
      
      // 缓存结果
      globalCache.set(cacheKey, allActivities);
      setActivities(allActivities);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('获取用户活动失败:', error);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  // 获取用户统计数据
  const fetchUserStats = useCallback(async () => {
    if (!user) return;
    
    const cacheKey = `user_stats_${user.id}`;
    const cachedStats = globalCache.get(cacheKey);
    
    if (cachedStats && !cachedStats.expires < Date.now()) {
      setStats(cachedStats.value);
      return;
    }
    
    try {
      // 使用 Promise.all 并行获取各种统计数据
      const [boxStatsResult, taskCountResult, walletDataResult] = await Promise.all([
        // 获取宝箱统计
        supabase.rpc('get_user_box_stats', { user_id: user.id }),
        
        // 获取任务统计
        supabase
          .from('task_submissions')
          .select('status', { count: 'exact' })
          .eq('submitter_id', user.id),
          
        // 获取钱包数据
        supabase
          .from('wallet_connections')
          .select('address')
          .eq('user_id', user.id)
          .single()
      ]);
      
      const userStats = {
        boxStats: boxStatsResult.data || { opened: 0, total: 0 },
        taskCount: (taskCountResult.data || []).length,
        completedTasks: (taskCountResult.data || []).filter(t => t.status === 'approved').length,
        walletAddress: walletDataResult.data?.address
      };
      
      // 缓存结果
      globalCache.set(cacheKey, userStats);
      setStats(userStats);
    } catch (error) {
      console.error('获取用户统计数据失败:', error);
    }
  }, [user]);

  // 加载数据
  useEffect(() => {
    if (user) {
      fetchActivities();
      fetchUserStats();
    }
    
    // 设置定时刷新
    const refreshInterval = setInterval(() => {
      if (user && document.visibilityState === 'visible') {
        fetchActivities();
        fetchUserStats();
      }
    }, 60000); // 1分钟刷新一次
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchActivities, fetchUserStats, user]);

  // 使用 useMemo 缓存计算结果
  const userProgress = useMemo(() => {
    if (!stats) return { percentage: 0, level: 0 };
    
    const completedPercentage = stats.taskCount > 0 
      ? (stats.completedTasks / stats.taskCount) * 100 
      : 0;
      
    // 计算用户等级
    const level = Math.floor(stats.completedTasks / 5) + 1;
    
    return {
      percentage: Math.round(completedPercentage),
      level
    };
  }, [stats]);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t('dashboard.title')}</h1>
      
      {/* 最后更新时间 */}
      {lastUpdate && (
        <p className="text-sm text-gray-500 mb-4">
          {t('dashboard.lastUpdated')}: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
      
      {/* 用户资料部分 - 优先渲染 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('profile.title')}</h2>
        <Suspense fallback={<div className="w-full h-40 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>}>
          <UserProfile />
        </Suspense>
      </section>
      
      {/* 统计数据部分 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.stats')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-medium">{t('dashboard.tasksCompleted')}</h3>
            <p className="text-2xl font-bold">{stats?.completedTasks || 0}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-medium">{t('dashboard.boxesOpened')}</h3>
            <p className="text-2xl font-bold">{stats?.boxStats?.opened || 0}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-medium">{t('dashboard.userLevel')}</h3>
            <p className="text-2xl font-bold">{userProgress.level}</p>
          </div>
        </div>
      </section>
      
      {/* 宝箱统计 - 延迟加载 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('treasureBox.title')}</h2>
        <TreasureBoxStats stats={stats?.boxStats} />
      </section>
      
      {/* 任务列表 - 延迟加载 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('tasks.title')}</h2>
        <TaskList 
          activities={activities.filter(a => a.type === 'task')}
          loading={loading}
        />
      </section>
    </div>
  );
};

export default DashboardOptimization; 