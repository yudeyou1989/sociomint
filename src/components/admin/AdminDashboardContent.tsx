'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboardContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-400"></div>
    </div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">管理员仪表板</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">总用户数</h3>
          <p className="text-2xl font-bold text-blue-400">1,250</p>
          <p className="text-sm text-gray-400">+15 今日新增</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">总交易量</h3>
          <p className="text-2xl font-bold text-green-400">125.5 BNB</p>
          <p className="text-sm text-gray-400">+2.3 BNB 今日</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">SM代币总量</h3>
          <p className="text-2xl font-bold text-yellow-400">1,000,000</p>
          <p className="text-sm text-gray-400">已发行</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">活跃任务</h3>
          <p className="text-2xl font-bold text-purple-400">25</p>
          <p className="text-sm text-gray-400">进行中</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">系统状态</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>区块链连接</span>
              <span className="text-green-400">● 正常</span>
            </div>
            <div className="flex justify-between items-center">
              <span>数据库状态</span>
              <span className="text-green-400">● 正常</span>
            </div>
            <div className="flex justify-between items-center">
              <span>API服务</span>
              <span className="text-green-400">● 正常</span>
            </div>
            <div className="flex justify-between items-center">
              <span>缓存服务</span>
              <span className="text-yellow-400">● 警告</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">最近活动</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>用户注册</span>
              <span className="text-gray-400">2分钟前</span>
            </div>
            <div className="flex justify-between">
              <span>代币交换</span>
              <span className="text-gray-400">5分钟前</span>
            </div>
            <div className="flex justify-between">
              <span>任务完成</span>
              <span className="text-gray-400">8分钟前</span>
            </div>
            <div className="flex justify-between">
              <span>质押操作</span>
              <span className="text-gray-400">12分钟前</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded p-4">
        <p className="text-red-300 text-sm">
          🔒 管理员功能：需要管理员权限才能访问完整功能
        </p>
      </div>
    </div>
  );
}
